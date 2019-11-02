/*
Copyright (C) 2019 Bester Intranet
*/

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const argon2 = require('argon2');
const multiparty = require('multiparty');

const Util = require('../../core/util');
const { Auth, AccessToken, User, Nonce } = require('../../core/auth');
const app = require('../../app');
const { Service, ServiceManager } = require('../../core/myaccount/servicemanager');

exports.showMyAccountSecurityPage = (req, res, next) => {
    Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {
        res.render('myaccount-security', {
            useBootstrap: false,
            scripts: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'Security | My Account',
            logoutNonce: result,
            activeItem: 'security',
            subtitle: 'Security'
        });
    });
}

exports.showMyAccountPasswordsPage = (req, res, next) => {
    const renderError = () => {
        Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {
            res.render('myaccount-security-passwords', {
                useBootstrap: false,
                scripts: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Passwords | Security | My Account',
                logoutNonce: result,
                activeItem: 'security',
                subtitle: 'Passwords'
            });
        });
    }

    const user = res.locals.user;

    const serviceManager = new ServiceManager(user.user_id);
    serviceManager.getServices().then(results => {
        var servicesWithPassword = [];

        results.forEach((rawService) => {
            var service = rawService.getSubclass();

            if(typeof service != 'string'){
                servicesWithPassword.push(service);
            }
        });

        Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {
            res.render('myaccount-security-passwords', {
                useBootstrap: false,
                scripts: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Passwords | Security | My Account',
                logoutNonce: result,
                activeItem: 'security',
                subtitle: 'Passwords',
                services: servicesWithPassword
            });
        });
    }, err => renderError());
}
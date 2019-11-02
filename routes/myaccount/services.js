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

exports.showMyAccountServicesPage = (req, res, next) => {
    const noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');

    const services = new ServiceManager(res.locals.user.user_id);
    const servicesPromise = services.getServices();

    Promise.all([noncePromise, servicesPromise]).then(results => {
        const services = results[1];
        res.render('myaccount-services', {
            useBootstrap: false,
            scripts: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'Services | My Account',
            logoutNonce: results[0],
            activeItem: 'services',
            subtitle: 'Services',
            services: services
        });
    });
}


exports.showMyAccountServiceDetailsPage = (req, res, next) => {
    const renderError = () => {
        Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {
            res.render('myaccount-services', {
                useBootstrap: false,
                scripts: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Services | My Account',
                logoutNonce: result,
                activeItem: 'services',
                subtitle: 'Unknown Service',
                service: rawService
            });
        });
    }

    const serviceName = req.params.serviceName;
    const path = req.originalUrl.replace('/accounts/myaccount/services/' + req.params.serviceName + '/', '');
    const user = res.locals.user;

    const rawService = new Service(user.user_id, null, serviceName);

    rawService.loadInfo().then(result => {
        var service = rawService.getSubclass();

        if(service.hasOwnProperty('passwordPage')){
            console.log(service.passwordPage);
        } else {
            console.log("No password page");
        }

        if(typeof service == 'string'){
            renderError();
        } else {
            if(typeof service['detailsPage'] === 'function'){
                service.detailsPage(req, res, next, path);
            } else {
                renderError();
            }
        }
    }, err => {
        renderError();
    });
}
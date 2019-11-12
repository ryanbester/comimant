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
const AuthUtil = require('../../core/auth-util')
const app = require('../../app');
const { Service, ServiceManager } = require('../../core/myaccount/servicemanager');

exports.showAdminUsersPage = (req, res, next) => {
    var noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    var usersPromise = AuthUtil.get_users();

    Promise.all([noncePromise, usersPromise]).then(results => {
        let nonce = results[0];
        let users = results[1];

        res.render('admin-users', {
            useBootstrap: false,
            scripts: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
            ],
            title: 'Users | Admin',
            logoutNonce: nonce,
            activeItem: 'users',
            subtitle: 'Users',
            users: users
        });
    });
}

exports.showAdminNewUserPage = (req, res, next) => {
    Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {    
        res.render('admin-users-new', {
            useBootstrap: false,
            scripts: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
            ],
            title: 'New User | Users | Admin',
            logoutNonce: result,
            activeItem: 'users',
            subtitle: 'New User'
        });
    });
}

exports.loadUserInfo = (req, res, next) => {
    const showError = () => {
        Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {
            res.render('admin-users-user', {
                useBootstrap: false,
                scripts: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
                ],
                title: 'Unknown User | Users | Admin',
                logoutNonce: result,
                activeItem: 'users',
                subtitle: 'Unknown User'
            });
        });
    }

    const userId = req.params.userId;
    const user = new User(userId);

    user.loadInfo().then(result => {
        res.locals.user = user;
        next();
    }, err => showError());
}

exports.showAdminUserPage = (req, res, next) => {
    const user = res.locals.user;

    const noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');

    const services = new ServiceManager(user.user_id);
    const servicesPromise = services.getServices();

    Promise.all([noncePromise, servicesPromise]).then(results => {    
        res.render('admin-users-user', {
            useBootstrap: false,
            scripts: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
            ],
            title: user.first_name + ' ' + user.last_name + ' | Users | Admin',
            logoutNonce: results[0],
            activeItem: 'users',
            subtitle: user.first_name + ' ' + user.last_name,
            adminUser: user,
            services: results[1]
        });
    });
}
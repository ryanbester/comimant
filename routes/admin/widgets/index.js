/*
Copyright (C) 2019-2020 Bester Intranet
*/

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const argon2 = require('argon2');
const multiparty = require('multiparty');

const Util = require('../../../core/util');
const { Auth, AccessToken, User, Nonce } = require('../../../core/auth');
const app = require('../../../app');

exports.showAdminWidgetsPage = (req, res, next) => {
    Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {
        res.render('admin-widgets', {
            useBootstrap: false,
            scriptsAfter: [
                'https://' + res.locals.main_domain + '/scripts/admin.js'
            ],
            title: 'Widgets | Admin',
            logoutNonce: result,
            activeItem: 'widgets',
            subtitle: 'Widgets'
        });
    });
}

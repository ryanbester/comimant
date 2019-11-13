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
const AuthUtil = require('../../core/auth-util');
const { PrivilegeTemplate, PrivilegeTemplates } = require('../../core/admin/privilege-templates');
const app = require('../../app');

exports.showAdminPrivilegeTemplatesPage = (req, res, next) => {
    var noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    var ptPromise = PrivilegeTemplates.getPrivilegeTemplates();

    Promise.all([noncePromise, ptPromise]).then(results => {
        let nonce = results[0];
        let privilegeTemplates = results[1];

        res.render('admin-privilege-templates', {
            useBootstrap: false,
            scripts: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
            ],
            title: 'Privilege Templates | Admin',
            logoutNonce: nonce,
            activeItem: 'privilege-templates',
            subtitle: 'Privilege Templates',
            privilegeTemplates: privilegeTemplates
        });
    });
}
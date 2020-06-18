/*
 * Copyright (C) 2019 - 2020 Comimant
 */

const { Nonce } = require('../../../core/auth/nonce');
const { AccessToken } = require('../../../core/auth/access-token');
const { Util } = require('../../../core/util');

exports.showMyAccountPage = (req, res) => {
    Nonce.createNonce('user-logout', '/accounts/logout').then(nonce => {
        res.render('accounts/my-account/index', {
            ...res.locals.stdArgs,
            title: 'My Account',
            logoutNonce: nonce,
            activeItem: 'home'
        });
    });
};
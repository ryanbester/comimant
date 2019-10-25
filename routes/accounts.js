/*
Copyright (C) 2019 Ryan Bester
*/

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const argon2 = require('argon2');
const multiparty = require('multiparty');

const Util = require('../core/util');
const { Auth, AccessToken, User, Nonce } = require('../core/auth');
const app = require('../app');

exports.showLoginPage = (req, res, next) => {
    res.render('login', {
        useBootstrap: false,
        title: 'Login',
        message: 'Login to the Bester Intranet',
        scripts: [
            'https://www.besterintranet.' + Util.get_tld() + '/scripts/login-page.js'
        ]
    });
}

exports.login = (req, res, next) => {
}

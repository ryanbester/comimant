/*
 * Copyright (C) 2019 - 2020 Comimant
 */

const express = require('express');

const { Util } = require('../core/util');

const app = require('../app');
const router = express.Router();

const status = require('../controllers/accounts/status');
const main = require('../controllers/accounts/my-account/index');
const myInfo = require('../controllers/accounts/my-account/my-info/index');

router.all('/*', status.userCheck);
router.all('/*', (req, res, next) => {
    // Set stylesheet and script to prevent typing it out every time
    res.locals.stdArgs = {
        stylesheets: [
            res.locals.protocol + res.locals.mainDomain + '/stylesheets/my-account.css'
        ],
        scriptsAfter: [
            res.locals.protocol + res.locals.mainDomain + '/scripts/my-account.js'
        ]
    };

    next();
});

router.get('/', main.showMyAccountPage);
router.get('/my-info', myInfo.showMyInfoPage);

module.exports = router;
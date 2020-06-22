/*
 * Comimant
 * Copyright (C) 2019 - 2020 Ryan Bester
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

const express = require('express');

const { Util } = require('../core/util');

const app = require('../app');
const router = express.Router();

const status = require('../controllers/accounts/status');
const main = require('../controllers/accounts/my-account/index');
const myInfo = require('../controllers/accounts/my-account/my-info/index');
const security = require('../controllers/accounts/my-account/security/index');

const myInfoName = require('../controllers/accounts/my-account/my-info/name');
const myInfoUsername = require('../controllers/accounts/my-account/my-info/username');
const myInfoDob = require('../controllers/accounts/my-account/my-info/dob');

const securityPasswords = require('../controllers/accounts/my-account/security/passwords');
const securityPassword = require('../controllers/accounts/my-account/security/password');
const securityLogoutEverywhere = require('../controllers/accounts/my-account/security/logout-everywhere');

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

router.get('/my-info/name', myInfoName.showNamePage);
router.post('/my-info/name', myInfoName.saveName);

router.get('/my-info/username', myInfoUsername.showUsernamePage);
router.post('/my-info/username', myInfoUsername.saveUsername);

router.get('/my-info/dob', myInfoDob.showDobPage);
router.post('/my-info/dob', myInfoDob.saveDob);

router.get('/security', security.showSecurityPage);

router.get('/security/passwords', securityPasswords.showPasswordsPage);

router.get('/security/passwords/change-password', securityPassword.showPasswordPage);
router.post('/security/passwords/change-password', securityPassword.savePassword);

router.get('/security/logout-everywhere', securityLogoutEverywhere.showLogoutEverywherePage);
router.get('/security/logout-everywhere/all-devices', securityLogoutEverywhere.performLogoutEverywhereAll);
router.get('/security/logout-everywhere/other-devices', securityLogoutEverywhere.performLogoutEverywhereOther);

module.exports = router;
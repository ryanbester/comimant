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
const main = require('../controllers/admin/index');
const users = require('../controllers/admin/users/index');

const usersNew = require('../controllers/admin/users/new');
const user = require('../controllers/admin/users/user');

router.all('/*', status.userCheck);
router.all('/*', main.userCheck);
router.all('/*', (req, res, next) => {
    // Set stylesheet and script to prevent typing it out every time
    res.locals.stdArgs = {
        stylesheets: [
            res.locals.protocol + res.locals.mainDomain + '/stylesheets/my-account.css'
        ],
        scriptsAfter: [
            res.locals.protocol + res.locals.mainDomain + '/scripts/admin.js'
        ]
    };

    next();
});

router.get('/', main.showAdminPage);

router.get('/users', users.showUsersPage);

router.get('/users/new', usersNew.showNewUserPage);
router.post('/users/new', usersNew.saveNewUser);

router.all('/users/:userId', user.loadUserInfo);
router.get('/users/:userId', user.showUserPage);

module.exports = router;
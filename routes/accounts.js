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

const myAccountRoutes = require('./my-account');

const login = require('../controllers/accounts/login');
const logout = require('../controllers/accounts/logout');
const status = require('../controllers/accounts/status');

router.get('/login', login.showLoginPage);
router.post('/login', login.performLogin);

router.get('/logout', logout.logout);

router.use('/myaccount', myAccountRoutes);

module.exports = router;
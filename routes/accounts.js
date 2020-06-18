/*
 * Copyright (C) 2019 - 2020 Comimant
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
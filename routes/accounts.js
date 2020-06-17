/*
 * Copyright (C) 2019 - 2020 Comimant
 */

const express = require('express');

const { Util } = require('../core/util');

const app = require('../app');
const router = express.Router();

const login = require('../controllers/accounts/login');

router.get('/login', login.showLoginPage);
router.post('/login', login.performLogin);

module.exports = router;
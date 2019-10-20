/*
Copyright (C) 2019 Ryan Bester
*/

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const argon2 = require('argon2');
const path = require('path');

const app = require('../app');
//const authRoutes = require('../routes/authRoutes');
//const { AccessToken, Nonce, User } = require('../core/auth');

const showHomePage = (req, res, next) => {
    res.send("Welcome to the Bester Intranet").end();
}

router.get('/', showHomePage);

module.exports = router;
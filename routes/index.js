/*
Copyright (C) 2019 Ryan Bester
*/

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const argon2 = require('argon2');
const path = require('path');

const app = require('../app');
const Util = require("../core/util");
const accountsRoutes = require('../routes/accounts');
const { AccessToken, Nonce, User } = require('../core/auth');

const showHomePage = (req, res, next) => {
    /*const username = "ryan@ryanbester.com";
    const password = "Password1";

    Auth.readPasswordFromDatabase(username).then(result => {
        Auth.verifyPassword(password, {
            all: result
        }).then(result => {
            if(result == false){
                console.log("Access denied");
            } else {
                const user = result;

                console.log("Success");
            }
        }, err => console.log(err));
    }, err => console.log(err));*/

    let tld = Util.get_tld();

    res.send('<a href="https://accounts.besterintranet.' + tld + '/login/">Login</a>').end();
}

router.get('/', showHomePage);

router.get('/accounts/login/', accountsRoutes.showLoginPage);
router.post('/accounts/login/', accountsRoutes.login);

module.exports = router;

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
const { Auth, AccessToken, Nonce, User } = require('../core/auth');

const showHomePage = (req, res, next) => {
    const username = "ryan@ryanbester.com";
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
    }, err => console.log(err));
}

router.get('/', showHomePage);

module.exports = router;

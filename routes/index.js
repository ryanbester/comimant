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
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    if(req.signedCookies['AUTHTOKEN'] === undefined){
        let tld = Util.get_tld();

        res.send('<p>Not logged in</p>');
        res.send('<a href="https://accounts.besterintranet.' + tld + '/login/">Login</a>').end();
    } else {
        const accessToken = new AccessToken(null, null, req.signedCookies['AUTHTOKEN']);
        accessToken.checkToken().then(result => {
            if(result == true){
                const user = new User(accessToken.user_id);
                user.verifyUser().then(result => {
                    if(result == true){
                        user.loadInfo().then(result => {
                            res.locals.user = user;
                            let tld = Util.get_tld();

                            res.send('<p>Logged in as ' + user.first_name + ' ' + user.last_name + '</p>');
                            res.send('<a href="https://accounts.besterintranet.' + tld + '/logout/">Login</a>').end();
                        }, err => {
                            let tld = Util.get_tld();

                            res.send('<p>Not logged in</p>');
                            res.send('<a href="https://accounts.besterintranet.' + tld + '/login/">Login</a>').end();
                        });
                    } else {
                        let tld = Util.get_tld();

                        res.send('<p>Not logged in</p>');
                        res.send('<a href="https://accounts.besterintranet.' + tld + '/login/">Login</a>').end();
                    }
                }, err => {
                    let tld = Util.get_tld();

                    res.send('<p>Not logged in</p>');
                    res.send('<a href="https://accounts.besterintranet.' + tld + '/login/">Login</a>').end();
                });
            } else {
                let tld = Util.get_tld();

                res.send('<p>Not logged in</p>');
                res.send('<a href="https://accounts.besterintranet.' + tld + '/login/">Login</a>').end();
            }
        }, err => {
            let tld = Util.get_tld();

            res.send('<p>Not logged in</p>');
            res.send('<a href="https://accounts.besterintranet.' + tld + '/login/">Login</a>').end();
        });
    }
}

router.get('/', showHomePage);

router.get('/accounts/login/', accountsRoutes.showLoginPage);
router.post('/accounts/login/', accountsRoutes.login);

router.get('/accounts/logout/', accountsRoutes.logout);

router.all('/accounts/myaccount*', accountsRoutes.userCheck);

router.get('/accounts/myaccount/', accountsRoutes.showMyAccountPage);
router.get('/accounts/myaccount/my-info/', accountsRoutes.showMyAccountMyInfoPage);

router.get('/accounts/myaccount/my-info/name/', accountsRoutes.showMyAccountMyInfoNamePage);
router.post('/accounts/myaccount/my-info/name/', accountsRoutes.performMyAccountSaveName);

router.get('/accounts/myaccount/my-info/username/', accountsRoutes.showMyAccountMyInfoUsernamePage);
router.post('/accounts/myaccount/my-info/username/', accountsRoutes.performMyAccountSaveUsername);

router.get('/accounts/myaccount/my-info/dob/', accountsRoutes.showMyAccountMyInfoDobPage);
router.post('/accounts/myaccount/my-info/dob/', accountsRoutes.performMyAccountSaveDob);

router.get('/accounts/myaccount/security/', accountsRoutes.showMyAccountSecurityPage);
router.get('/accounts/myaccount/services/', accountsRoutes.showMyAccountServicesPage);
router.get('/accounts/myaccount/data/', accountsRoutes.showMyAccountDataPage);

router.get('/accounts/myaccount/test/', accountsRoutes.showPasswordConfirmationPage);
router.post('/accounts/myaccount/test/', accountsRoutes.checkPassword);
router.get('/accounts/myaccount/test/', (req, res, next) => {
    res.send("Success").end();
});

module.exports = router;

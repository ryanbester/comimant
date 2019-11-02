/*
Copyright (C) 2019 Bester Intranet
*/

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const argon2 = require('argon2');
const path = require('path');

const app = require('../app');
const Util = require("../core/util");
const accountsRoutes = require('../routes/accounts');
const myAccountMyInfoRoutes = require('../routes/myaccount/my-info');
const myAccountSecurityRoutes = require('../routes/myaccount/security');
const myAccountServicesRoutes = require('../routes/myaccount/services');
const myAccountDataRoutes = require('../routes/myaccount/data');
const { AccessToken, Nonce, User } = require('../core/auth');

const showHomePage = (req, res, next) => {
    const renderHomePage = () => {
        res.render('home', {
            useBootstrap: false,
            tld: Util.get_tld()
        });
    }

    // Disable cache
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    const fullUrl = req.protocol + '://' + Util.url_rewrite(req.get('host'), req.url);

    if(req.signedCookies['AUTHTOKEN'] === undefined){
        renderHomePage();
    } else {
        const accessToken = new AccessToken(null, null, req.signedCookies['AUTHTOKEN']);
        accessToken.checkToken().then(result => {
            if(result == true){
                const user = new User(accessToken.user_id);
                user.verifyUser().then(result => {
                    if (result == true) {
                        user.loadInfo().then(result => {
                            res.locals.user = user;
                            renderHomePage();
                        }, err => {
                            renderHomePage();
                        });
                    } else {
                        renderHomePage();
                    }
                }, err => {
                    renderHomePage();
                });
            } else {
                renderHomePage();
            }
        }, err => {
            renderHomePage();
        });
    }
}

router.get('/', showHomePage);

router.get('/accounts/login/', accountsRoutes.showLoginPage);
router.post('/accounts/login/', accountsRoutes.login);

router.get('/accounts/logout/', accountsRoutes.logout);

router.all('/accounts/myaccount*', accountsRoutes.userCheck);

// My Account routes

// TODO: Refactor code
// Each service is subclass of Service
// has methods for service page, password change, storage usage
// Uses new Service(...).hasOwnProperty(name) to check if the method exists
// e.g. var service = new Service('bestermail');
// if (service.hasOwnProperty('changePassword')) {
//     service.changePassword();
// }

const myAccountPath = '/accounts/myaccount/';

router.get(myAccountPath, accountsRoutes.showMyAccountPage);
router.get(myAccountPath + 'my-info/', myAccountMyInfoRoutes.showMyAccountMyInfoPage);

router.get(myAccountPath + 'my-info/name/', myAccountMyInfoRoutes.showMyAccountMyInfoNamePage);
router.post(myAccountPath + 'my-info/name/', myAccountMyInfoRoutes.performMyAccountSaveName);

router.get(myAccountPath + 'my-info/username/', myAccountMyInfoRoutes.showMyAccountMyInfoUsernamePage);
router.post(myAccountPath + 'my-info/username/', myAccountMyInfoRoutes.performMyAccountSaveUsername);

router.get(myAccountPath + 'my-info/dob/', myAccountMyInfoRoutes.showMyAccountMyInfoDobPage);
router.post(myAccountPath + 'my-info/dob/', myAccountMyInfoRoutes.performMyAccountSaveDob);

router.get(myAccountPath + 'security/', myAccountSecurityRoutes.showMyAccountSecurityPage);
router.get(myAccountPath + 'security/passwords/', myAccountSecurityRoutes.showMyAccountPasswordsPage);

router.get(myAccountPath + 'security/passwords/change-password/', myAccountSecurityRoutes.showChangePasswordPage);
router.post(myAccountPath + 'security/passwords/change-password/', myAccountSecurityRoutes.performChangePassword);

router.get(myAccountPath + 'security/logout-everywhere/', myAccountSecurityRoutes.showLogoutEverywhereConfirmation);
router.get(myAccountPath + 'security/logout-everywhere/all-devices/', myAccountSecurityRoutes.performLogoutEverywhereAll);
router.get(myAccountPath + 'security/logout-everywhere/other-devices/', myAccountSecurityRoutes.performLogoutEverywhereOther)

router.get(myAccountPath + 'services/', myAccountServicesRoutes.showMyAccountServicesPage);

router.get(myAccountPath + 'services/:serviceName/*', myAccountServicesRoutes.showMyAccountServiceDetailsPage);

router.get(myAccountPath + 'data/', myAccountDataRoutes.showMyAccountDataPage);

router.get(myAccountPath + 'test/', accountsRoutes.showPasswordConfirmationPage);
router.post(myAccountPath + 'test/', accountsRoutes.checkPassword);
router.get(myAccountPath + 'test/', (req, res, next) => {
    res.send("Success").end();
});

module.exports = router;

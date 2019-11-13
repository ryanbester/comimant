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
const adminRoutes = require('../routes/admin/admin');
const adminUserRoutes = require('../routes/admin/users');
const adminPrivilegeTemplatesRoutes = require('../routes/admin/privilege-templates');
const adminAccessTokensRoutes = require('../routes/admin/access-tokens');
const adminNoncesRoutes = require('../routes/admin/nonces');
const adminDataRoutes = require('../routes/admin/data');
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

const adminPath = '/admin/';
router.all('/admin/*', adminRoutes.userCheck);
router.get(adminPath, adminRoutes.showAdminPanel);
router.get(adminPath + 'users/', adminUserRoutes.showAdminUsersPage);
router.get(adminPath + 'users/new/', adminUserRoutes.showAdminNewUserPage);
router.all(adminPath + 'users/:userId/*', adminUserRoutes.loadUserInfo);
router.get(adminPath + 'users/:userId/', adminUserRoutes.showAdminUserPage);
router.get(adminPath + 'users/:userId/name/', adminUserRoutes.showAdminUsersNamePage);
router.post(adminPath + 'users/:userId/name/', adminUserRoutes.performAdminUsersSaveName);
router.get(adminPath + 'users/:userId/username/', adminUserRoutes.showAdminUsersUsernamePage);
router.post(adminPath + 'users/:userId/username/', adminUserRoutes.performAdminUsersSaveUsername);
router.get(adminPath + 'users/:userId/email-address/', adminUserRoutes.showAdminUsersEmailAddressPage);
router.post(adminPath + 'users/:userId/email-address/', adminUserRoutes.performAdminUsersSaveEmailAddress);
router.get(adminPath + 'users/:userId/dob/', adminUserRoutes.showAdminUsersDobPage);
router.post(adminPath + 'users/:userId/dob/', adminUserRoutes.performAdminUsersSaveDob);
router.get(adminPath + 'privilege-templates/', adminPrivilegeTemplatesRoutes.showAdminPrivilegeTemplatesPage);
router.get(adminPath + 'access-tokens/', adminAccessTokensRoutes.showAdminAccessTokensPage);
router.get(adminPath + 'nonces/', adminNoncesRoutes.showAdminNoncesPage);
router.get(adminPath + 'data/', adminDataRoutes.showAdminDataPage);

module.exports = router;

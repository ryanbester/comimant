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
const adminWidgetsRoutes = require('../routes/admin/widgets');
const adminAccessTokensRoutes = require('../routes/admin/access-tokens');
const adminNoncesRoutes = require('../routes/admin/nonces');
const adminDataRoutes = require('../routes/admin/data');
const { AccessToken, Nonce, User } = require('../core/auth');

const showHomePage = (req, res, next) => {
    const renderHomePage = (nonce) => {
        res.render('home', {
            useBootstrap: false,
            tld: Util.get_tld(),
            logoutNonce: nonce,
            scriptsAfter: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/grid.js'
            ]
        });
    }

    Nonce.createNonce('user-logout', '/accounts/logout/').then(nonce => {
        // Disable cache
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

        const fullUrl = req.protocol + '://' + Util.url_rewrite(req.get('host'), req.url);

        if(req.signedCookies['AUTHTOKEN'] === undefined){
            renderHomePage(nonce);
        } else {
            const accessToken = new AccessToken(null, null, req.signedCookies['AUTHTOKEN']);
            accessToken.checkToken().then(result => {
                if(result == true){
                    const user = new User(accessToken.user_id);
                    user.verifyUser().then(result => {
                        if (result == true) {
                            user.loadInfo().then(result => {
                                res.locals.user = user;
                                renderHomePage(nonce);
                            }, err => {
                                renderHomePage(nonce);
                            });
                        } else {
                            renderHomePage(nonce);
                        }
                    }, err => {
                        renderHomePage(nonce);
                    });
                } else {
                    renderHomePage(nonce);
                }
            }, err => {
                renderHomePage(nonce);
            });
        }
    });
}

router.get('/', showHomePage);
router.get('/add', showHomePage);

router.get('/accounts/login/', accountsRoutes.showLoginPage);
router.post('/accounts/login/', accountsRoutes.login);

router.get('/accounts/logout/', accountsRoutes.logout);

router.get('/usercheck/', accountsRoutes.userLoggedIn);

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
router.all('/admin', adminRoutes.userCheck);
router.all('/admin/*', adminRoutes.userCheck);
router.get(adminPath, adminRoutes.showAdminPanel);

router.get(adminPath + 'users/', adminUserRoutes.showAdminUsersPage);
router.get(adminPath + 'users/new/', adminUserRoutes.showAdminNewUserPage);
router.post(adminPath + 'users/new/', adminUserRoutes.performAdminNewUser);
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

router.get(adminPath + 'users/:userId/widgets/', adminUserRoutes.showAdminUserWidgetsPage);
router.get(adminPath + 'users/:userId/widgets/add-widget/', adminUserRoutes.showAdminUserAddWidgetPage);
router.post(adminPath + 'users/:userId/widgets/add-widget/', adminUserRoutes.performAdminUserAddWidget);
router.all(adminPath + 'users/:userId/widgets/:widgetId/*', adminUserRoutes.loadUserWidgetInfo);
router.get(adminPath + 'users/:userId/widgets/:widgetId/', adminUserRoutes.showAdminUserWidgetPage);
router.get(adminPath + 'users/:userId/widgets/:widgetId/delete-widget/', adminUserRoutes.showAdminUserDeleteWidgetPage);
router.post(adminPath + 'users/:userId/widgets/:widgetId/delete-widget/', adminUserRoutes.performAdminUserDeleteWidget);
router.get(adminPath + 'users/:userId/widgets/:widgetId/title/', adminUserRoutes.showAdminUserWidgetTitlePage);
router.post(adminPath + 'users/:userId/widgets/:widgetId/title/', adminUserRoutes.performAdminUserWidgetSaveTitle);
router.get(adminPath + 'users/:userId/widgets/:widgetId/type/', adminUserRoutes.showAdminUserWidgetTypePage);
router.post(adminPath + 'users/:userId/widgets/:widgetId/type/', adminUserRoutes.performAdminUserWidgetSaveType);
router.get(adminPath + 'users/:userId/widgets/:widgetId/data/', adminUserRoutes.showAdminUserWidgetDataPage);
router.post(adminPath + 'users/:userId/widgets/:widgetId/data/', adminUserRoutes.performAdminUserWidgetSaveData);
router.get(adminPath + 'users/:userId/widgets/:widgetId/position/', adminUserRoutes.showAdminUserWidgetPositionPage);
router.post(adminPath + 'users/:userId/widgets/:widgetId/position/', adminUserRoutes.performAdminUserWidgetSavePosition);
router.get(adminPath + 'users/:userId/widgets/:widgetId/height/', adminUserRoutes.showAdminUserWidgetHeightPage);
router.post(adminPath + 'users/:userId/widgets/:widgetId/height/', adminUserRoutes.performAdminUserWidgetSaveHeight);

router.get(adminPath + 'users/:userId/security/privileges/', adminUserRoutes.showAdminUserPrivilegesPage);
router.post(adminPath + 'users/:userId/security/privileges/', adminUserRoutes.performAdminUserSavePrivileges);
router.get(adminPath + 'users/:userId/security/privileges/add-privilege/', adminUserRoutes.showAdminUserAddPrivilegePage);
router.post(adminPath + 'users/:userId/security/privileges/add-privilege/', adminUserRoutes.performAdminUserAddPrivilege);
router.get(adminPath + 'users/:userId/security/privileges/apply-template/', adminUserRoutes.showAdminUserApplyPrivilegeTemplatePage);
router.post(adminPath + 'users/:userId/security/privileges/apply-template/', adminUserRoutes.performAdminUserApplyPrivilegeTemplate);
router.get(adminPath + 'users/:userId/security/passwords/', adminUserRoutes.showAdminUserPasswordsPage);
router.get(adminPath + 'users/:userId/security/passwords/change-password/', adminUserRoutes.showUserChangePasswordPage);
router.post(adminPath + 'users/:userId/security/passwords/change-password/', adminUserRoutes.performUserChangePassword);

router.get(adminPath + 'users/:userId/delete-user/', adminUserRoutes.showAdminDeleteUserPage);
router.post(adminPath + 'users/:userId/delete-user/', adminUserRoutes.performAdminDeleteUser);

router.get(adminPath + 'privilege-templates/', adminPrivilegeTemplatesRoutes.showAdminPrivilegeTemplatesPage);
router.get(adminPath + 'privilege-templates/create/', adminPrivilegeTemplatesRoutes.showCreatePrivilegeTemplatePage);
router.post(adminPath + 'privilege-templates/create/', adminPrivilegeTemplatesRoutes.performCreatePrivilegeTemplate);
router.all(adminPath + 'privilege-templates/:name/*', adminPrivilegeTemplatesRoutes.loadPrivilegeTemplateInfo);
router.get(adminPath + 'privilege-templates/:name/', adminPrivilegeTemplatesRoutes.showPrivilegeTemplatePage);
router.post(adminPath + 'privilege-templates/:name/', adminPrivilegeTemplatesRoutes.performPrivilegeTemplateSave);
router.get(adminPath + 'privilege-templates/:name/name/', adminPrivilegeTemplatesRoutes.showPrivilegeTemplateNamePage);
router.post(adminPath + 'privilege-templates/:name/name/', adminPrivilegeTemplatesRoutes.performPrivilegeTemplateSaveName);
router.get(adminPath + 'privilege-templates/:name/title/', adminPrivilegeTemplatesRoutes.showPrivilegeTemplateTitlePage);
router.post(adminPath + 'privilege-templates/:name/title/', adminPrivilegeTemplatesRoutes.performPrivilegeTemplateSaveTitle);
router.get(adminPath + 'privilege-templates/:name/default/', adminPrivilegeTemplatesRoutes.showPrivilegeTemplateDefaultPage);
router.post(adminPath + 'privilege-templates/:name/default/', adminPrivilegeTemplatesRoutes.performPrivilegeTemplateSaveDefault);
router.get(adminPath + 'privilege-templates/:name/add-privilege/', adminPrivilegeTemplatesRoutes.showPrivilegeTemplateAddPrivilegePage);
router.post(adminPath + 'privilege-templates/:name/add-privilege/', adminPrivilegeTemplatesRoutes.performPrivilegeTemplateAddPrivilege);
router.get(adminPath + 'privilege-templates/:name/delete-privilege-template/', adminPrivilegeTemplatesRoutes.showPrivilegeTemplateDeletePage);
router.post(adminPath + 'privilege-templates/:name/delete-privilege-template/', adminPrivilegeTemplatesRoutes.performPrivilegeTemplateDelete);

router.get(adminPath + 'widgets/', adminWidgetsRoutes.showAdminWidgetsPage);

router.get(adminPath + 'access-tokens/', adminAccessTokensRoutes.showAdminAccessTokensPage);
router.get(adminPath + 'nonces/', adminNoncesRoutes.showAdminNoncesPage);
router.get(adminPath + 'data/', adminDataRoutes.showAdminDataPage);

module.exports = router;

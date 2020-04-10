/*
Copyright (C) 2019-2020 Bester Intranet
*/

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const argon2 = require('argon2');
const path = require('path');

const app = require('../app');
const Util = require("../core/util");
const accounts = require('../routes/accounts');
const myAccountMyInfo = require('../routes/myaccount/my-info');
const myAccountSecurity = require('../routes/myaccount/security');
const myAccountServices = require('../routes/myaccount/services');
const myAccountData = require('../routes/myaccount/data');
const admin = require('./admin');
const adminUserRoutes = require('../routes/admin/users');
const adminPrivilegeTemplates = require('../routes/admin/privilege-templates');
const adminWidgets = require('../routes/admin/widgets');
const adminAccessTokens = require('../routes/admin/access-tokens');
const adminNonces = require('../routes/admin/nonces');
const adminData = require('../routes/admin/data');
const { AccessToken, Nonce, User } = require('../core/auth');

const internalAPIMain = require('../routes/api/internal/main');
const internalAPIWidgets = require('../routes/api/internal/widgets');
const internalAPIWeather = require('../routes/api/internal/weather');

const showHomePage = (req, res, next) => {
    const renderHomePage = (nonce) => {
        res.render('home', {
            useBootstrap: false,
            tld: Util.get_tld(),
            logoutNonce: nonce,
            scriptsBefore: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/grid.js',
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/widget.js',
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/add-widget-dialog.js'
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

router.get('/accounts/login/', accounts.showLoginPage);
router.post('/accounts/login/', accounts.login);

router.get('/accounts/logout/', accounts.logout);

router.get('/usercheck/', accounts.userLoggedIn);

router.all('/accounts/myaccount*', accounts.userCheck);

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

router.get(myAccountPath, accounts.showMyAccountPage);
router.get(myAccountPath + 'my-info/', myAccountMyInfo.showMyAccountMyInfoPage);

router.get(myAccountPath + 'my-info/name/', myAccountMyInfo.showMyAccountMyInfoNamePage);
router.post(myAccountPath + 'my-info/name/', myAccountMyInfo.performMyAccountSaveName);

router.get(myAccountPath + 'my-info/username/', myAccountMyInfo.showMyAccountMyInfoUsernamePage);
router.post(myAccountPath + 'my-info/username/', myAccountMyInfo.performMyAccountSaveUsername);

router.get(myAccountPath + 'my-info/dob/', myAccountMyInfo.showMyAccountMyInfoDobPage);
router.post(myAccountPath + 'my-info/dob/', myAccountMyInfo.performMyAccountSaveDob);

router.get(myAccountPath + 'security/', myAccountSecurity.showMyAccountSecurityPage);
router.get(myAccountPath + 'security/passwords/', myAccountSecurity.showMyAccountPasswordsPage);

router.get(myAccountPath + 'security/passwords/change-password/', myAccountSecurity.showChangePasswordPage);
router.post(myAccountPath + 'security/passwords/change-password/', myAccountSecurity.performChangePassword);

router.get(myAccountPath + 'security/logout-everywhere/', myAccountSecurity.showLogoutEverywhereConfirmation);
router.get(myAccountPath + 'security/logout-everywhere/all-devices/', myAccountSecurity.performLogoutEverywhereAll);
router.get(myAccountPath + 'security/logout-everywhere/other-devices/', myAccountSecurity.performLogoutEverywhereOther)

router.get(myAccountPath + 'services/', myAccountServices.showMyAccountServicesPage);

router.get(myAccountPath + 'services/:serviceName/*', myAccountServices.showMyAccountServiceDetailsPage);

router.get(myAccountPath + 'data/', myAccountData.showMyAccountDataPage);

router.get(myAccountPath + 'test/', accounts.showPasswordConfirmationPage);
router.post(myAccountPath + 'test/', accounts.checkPassword);
router.get(myAccountPath + 'test/', (req, res, next) => {
    res.send("Success").end();
});

// Internal API
const internalAPIPath = '/api/internal/';
router.all(internalAPIPath + 'widgets/*', internalAPIMain.userCheck);
router.all(internalAPIPath + '/weather/*', internalAPIMain.userCheck);

router.get(internalAPIPath + 'widgets/', internalAPIWidgets.getAllWidgets);
router.post(internalAPIPath + 'widgets/', internalAPIWidgets.addWidget);

router.get(internalAPIPath + 'widgets/:widgetId', internalAPIWidgets.getWidget);
router.delete(internalAPIPath + 'widgets/:widgetId', internalAPIWidgets.deleteWidget);
router.put(internalAPIPath + 'widgets/:widgetId', internalAPIWidgets.updateWidget);

router.get(internalAPIPath + 'weather/', internalAPIWeather.getWeather);
// Public API

// Admin section

const adminPath = '/admin/';
router.all('/admin', admin.userCheck);
router.all('/admin/*', admin.userCheck);
router.get(adminPath, admin.showAdminPanel);

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

router.get(adminPath + 'privilege-templates/', adminPrivilegeTemplates.showAdminPrivilegeTemplatesPage);
router.get(adminPath + 'privilege-templates/create/', adminPrivilegeTemplates.showCreatePrivilegeTemplatePage);
router.post(adminPath + 'privilege-templates/create/', adminPrivilegeTemplates.performCreatePrivilegeTemplate);
router.all(adminPath + 'privilege-templates/:name/*', adminPrivilegeTemplates.loadPrivilegeTemplateInfo);
router.get(adminPath + 'privilege-templates/:name/', adminPrivilegeTemplates.showPrivilegeTemplatePage);
router.post(adminPath + 'privilege-templates/:name/', adminPrivilegeTemplates.performPrivilegeTemplateSave);
router.get(adminPath + 'privilege-templates/:name/name/', adminPrivilegeTemplates.showPrivilegeTemplateNamePage);
router.post(adminPath + 'privilege-templates/:name/name/', adminPrivilegeTemplates.performPrivilegeTemplateSaveName);
router.get(adminPath + 'privilege-templates/:name/title/', adminPrivilegeTemplates.showPrivilegeTemplateTitlePage);
router.post(adminPath + 'privilege-templates/:name/title/', adminPrivilegeTemplates.performPrivilegeTemplateSaveTitle);
router.get(adminPath + 'privilege-templates/:name/default/', adminPrivilegeTemplates.showPrivilegeTemplateDefaultPage);
router.post(adminPath + 'privilege-templates/:name/default/', adminPrivilegeTemplates.performPrivilegeTemplateSaveDefault);
router.get(adminPath + 'privilege-templates/:name/add-privilege/', adminPrivilegeTemplates.showPrivilegeTemplateAddPrivilegePage);
router.post(adminPath + 'privilege-templates/:name/add-privilege/', adminPrivilegeTemplates.performPrivilegeTemplateAddPrivilege);
router.get(adminPath + 'privilege-templates/:name/delete-privilege-template/', adminPrivilegeTemplates.showPrivilegeTemplateDeletePage);
router.post(adminPath + 'privilege-templates/:name/delete-privilege-template/', adminPrivilegeTemplates.performPrivilegeTemplateDelete);

router.get(adminPath + 'widgets/', adminWidgets.showAdminWidgetsPage);

router.get(adminPath + 'access-tokens/', adminAccessTokens.showAdminAccessTokensPage);
router.get(adminPath + 'nonces/', adminNonces.showAdminNoncesPage);
router.get(adminPath + 'data/', adminData.showAdminDataPage);

module.exports = router;

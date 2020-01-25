/*
Copyright (C) 2019-2020 Bester Intranet
*/

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const argon2 = require('argon2');
const multiparty = require('multiparty');

const Util = require('../../core/util');
const { Auth, AccessToken, User, Nonce } = require('../../core/auth');
const app = require('../../app');
const { Service, ServiceManager } = require('../../core/myaccount/servicemanager');

exports.showMyAccountSecurityPage = (req, res, next) => {
    Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {
        res.render('myaccount-security', {
            useBootstrap: false,
            scriptsAfter: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'Security | My Account',
            logoutNonce: result,
            activeItem: 'security',
            subtitle: 'Security'
        });
    });
}

exports.showMyAccountPasswordsPage = (req, res, next) => {
    const renderError = () => {
        Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {
            res.render('myaccount-security-passwords', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Passwords | Security | My Account',
                logoutNonce: result,
                activeItem: 'security',
                subtitle: 'Passwords',
                error: 'Cannot load services'
            });
        });
    }

    const user = res.locals.user;

    const serviceManager = new ServiceManager(user.user_id);
    serviceManager.getServices().then(results => {
        var servicesWithPassword = [];

        results.forEach((rawService) => {
            var service = rawService.getSubclass();

            if(typeof service != 'string'){
                servicesWithPassword.push(service);
            }
        });

        Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {
            res.render('myaccount-security-passwords', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Passwords | Security | My Account',
                logoutNonce: result,
                activeItem: 'security',
                subtitle: 'Passwords',
                services: servicesWithPassword
            });
        });
    }, err => renderError());
}

exports.showChangePasswordPage = (req, res, next) => {
    const user = res.locals.user;

    const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const changePasswordNoncePromise = Nonce.createNonce('myaccount-user-change-password', '/accounts/myaccount/security/passwords/change-password/');

    Promise.all([logoutNoncePromise, changePasswordNoncePromise]).then(results => {
        res.render('myaccount-security-change-password', {
            useBootstrap: false,
            scriptsAfter: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'Change Password | Passwords | Security | My Account',
            logoutNonce: results[0],
            activeItem: 'security',
            subtitle: 'Change Password',
            formNonce: results[1]
        });
    });
}

exports.performChangePassword = (req, res, next) => {
    const showError = (error) => {
        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const changePasswordNoncePromise = Nonce.createNonce('myaccount-user-change-password', '/accounts/myaccount/security/passwords/change-password/');

        Promise.all([logoutNoncePromise, changePasswordNoncePromise]).then(results => {
            res.render('myaccount-security-change-password', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Change Password | Passwords | Security | My Account',
                logoutNonce: results[0],
                activeItem: 'security',
                subtitle: 'Change Password',
                formNonce: results[1],
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const changePasswordNoncePromise = Nonce.createNonce('myaccount-user-change-password', '/accounts/myaccount/security/passwords/change-password/');

        Promise.all([logoutNoncePromise, changePasswordNoncePromise]).then(results => {
            res.render('myaccount-security-change-password', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Change Password | Passwords | Security | My Account',
                logoutNonce: results[0],
                activeItem: 'security',
                subtitle: 'Change Password',
                formNonce: results[1],
                success: message
            });
        });
    }

    Nonce.verifyNonce('myaccount-user-change-password', req.body.nonce, req.path).then(result => {
        if(result == true){
            const user = res.locals.user;

            const currentPassword = req.body.currentPassword;
            const newPassword = req.body.newPassword;
            const confirmPassword = req.body.confirmPassword;

            if(newPassword !== confirmPassword){
                showError("Passwords do not match");
            } else if (newPassword < 4){
                showError("Password must be at least 4 characters long");
            } else {
                Auth.readPasswordFromDatabase(user.email_address).then(result => {
                    Auth.verifyPassword(currentPassword, {
                        all: result
                    }).then(result => {
                        if(result == false){
                            showError("Current password is incorrect");
                        } else {
                            Auth.encryptPassword(newPassword).then(result => {
                                result.push(user.user_id);

                                Auth.savePasswordToDatabase({
                                    all: result
                                }).then(result => {
                                    if(result == true){
                                        showSuccess("Your password has been changed successfully");
                                    } else {
                                        showError("Cannot set your new password. Your password will remain unchanged.");
                                    }
                                }, err => {
                                    showError("Cannot set your new password. Your password will remain unchanged.");
                                });
                            }, err => {
                                showError("Cannot set your new password. Your password will remain unchanged.");
                            });
                        }
                    }, err => {
                        showError("Current password is incorrect");
                    });
                }, err => {
                    showError("Error changing your password. Please try again.");
                });
            }
        } else {
            showError("Error changing your password. Please try again.");
        }
    }, err => {
        showError("Error changing your password. Please try again.");
    });
}

exports.showLogoutEverywhereConfirmation = (req, res, next) => {
    const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const logoutEverywhereAllDevicesPromise = Nonce.createNonce('myaccount-logout-everywhere-all', '/accounts/myaccount/security/logout-everywhere/all-devices/');
    const logoutEverywhereOtherDevicesPromise = Nonce.createNonce('myaccount-logout-everywhere-other', '/accounts/myaccount/security/logout-everywhere/other-devices/');

    Promise.all([logoutNoncePromise, logoutEverywhereAllDevicesPromise, logoutEverywhereOtherDevicesPromise]).then(results => {
        res.render('myaccount-security-logout-everywhere', {
            useBootstrap: false,
            scriptsAfter: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'Logout of all Devices | Security | My Account',
            logoutNonce: results[0],
            activeItem: 'security',
            subtitle: 'Logout of all Devices',
            allDevicesNonce: results[1],
            otherDevicesNonce: results[2]
        });
    });
}

exports.performLogoutEverywhereAll = (req, res, next) => {
    const showError = (error) => {
        Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {
            res.render('myaccount-security-logout-everywhere-done', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Logout of all Devices | Security | My Account',
                logoutNonce: result,
                activeItem: 'security',
                subtitle: 'Logout of all Devices',
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {
            res.render('myaccount-security-logout-everywhere-done', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Logout of all Devices | Security | My Account',
                logoutNonce: result,
                activeItem: 'security',
                subtitle: 'Logout of all Devices',
                success: message
            });
        });
    }

    Nonce.verifyNonce('myaccount-logout-everywhere-all', req.query.nonce, req.path).then(result => {
        if(result == true){
            const user = res.locals.user;

            const accessToken = new AccessToken(user.user_id);
            accessToken.deleteUserTokens().then(result => {
                if(result == true){
                    showSuccess("Successfully logged you out on all your devices");
                } else {
                    showError("Error logging your out. Please try again.");
                }
            }, err => {
                showError("Error logging your out. Please try again.");
            });
        } else {
            showError("Error logging your out. Please try again.");
        }
    }, err => {
        showError("Error logging you out. Please try again.");
    });
}

exports.performLogoutEverywhereOther = (req, res, next) => {
    const showError = (error) => {
        Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {
            res.render('myaccount-security-logout-everywhere-done', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Logout of all Devices | Security | My Account',
                logoutNonce: result,
                activeItem: 'security',
                subtitle: 'Logout of all Devices',
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {
            res.render('myaccount-security-logout-everywhere-done', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Logout of all Devices | Security | My Account',
                logoutNonce: result,
                activeItem: 'security',
                subtitle: 'Logout of all Devices',
                success: message
            });
        });
    }

    Nonce.verifyNonce('myaccount-logout-everywhere-other', req.query.nonce, req.path).then(result => {
        if(result == true){
            const user = res.locals.user;

            const accessToken = new AccessToken(user.user_id);
            accessToken.deleteUserTokens([ req.signedCookies['AUTHTOKEN'] ]).then(result => {
                if(result == true){
                    showSuccess("Successfully logged you out on your other devices");
                } else {
                    showError("Error logging your out. Please try again.");
                }
            }, err => {
                showError("Error logging your out. Please try again.");
            });
        } else {
            showError("Error logging your out. Please try again.");
        }
    }, err => {
        showError("Error logging you out. Please try again.");
    });
}
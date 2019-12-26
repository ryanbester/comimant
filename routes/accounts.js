/*
Copyright (C) 2019 Bester Intranet
*/

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const argon2 = require('argon2');
const multiparty = require('multiparty');

const Util = require('../core/util');
const { Auth, AccessToken, User, Nonce } = require('../core/auth');
const app = require('../app');
const { Service, ServiceManager } = require('../core/myaccount/servicemanager');

exports.showLoginPage = (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    const renderLoginPage = () => {
        Nonce.createNonce('user-login', '/accounts/login/').then(result => {
            res.render('login', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/login-page.js'
                ],
                title: 'Login',
                message: 'Login to the Bester Intranet',
                nonce: result
            });
        });
    }
    
    if(req.signedCookies['AUTHTOKEN'] !== undefined){
        const accessToken = new AccessToken(null, null, req.signedCookies['AUTHTOKEN']);
        accessToken.checkToken().then(result => {
            if(result == true){
                const user = new User(accessToken.user_id);
                user.verifyUser().then(result => {
                    if (result == true) {
                        res.redirect(301, 'https://www.besterintranet.' + Util.get_tld());
                    } else {
                        renderLoginPage();
                    }
                }, err => {
                    renderLoginPage();
                });
            } else {
                renderLoginPage();
            }
        }, err => {
            renderLoginPage();
        });
    } else {
        renderLoginPage();
    }
}

exports.login = (req, res, next) => {
    const renderError = (error) => {
        Nonce.createNonce('user-login', '/accounts/login/').then(result => {
            res.render('login', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/login-page.js'
                ],
                title: 'Login',
                message: 'Login to the Bester Intranet',
                error: error,
                username: username,
                emailDomain: emailDomain,
                nonce: result
            });
        });
    }

    const username = req.body.username;
    const emailDomain = req.body.emailDomain;
    const password = req.body.password;
    const rememberMe = req.body.remember_me;

    if(emailDomain === undefined || emailDomain == ''){
        renderError("Please enter a valid email address");
    }

    if(emailDomain.length < 2){
        renderError("Please enter a valid email address");
    }

    if(emailDomain.charAt(0) != '@'){
        renderError("Please enter a valid email address");
    }

    if(username === undefined || username === ''){
        renderError("Your username or password is incorrect");
    }

    if(password === undefined || password == ''){
        renderError("Your username or password is incorrect");
    }

    const nonce = req.body.nonce;
    Nonce.verifyNonce('user-login', nonce, req.path).then(result => {
        if(result == true){
            Auth.readPasswordFromDatabase(username + emailDomain).then(result => {
                // Verify the password
                Auth.verifyPassword(password, {
                    all: result
                }).then(result => {
                    if(result == false){
                        renderError("Your username or password is incorrect");
                    } else {
                        const user = result;

                        user.loadInfo().then(result => {
                            if(result == true){
                                // If authentication is successful, generate an access token
                                const accessToken = new AccessToken(user.user_id);

                                accessToken.saveTokenToDatabase().then(result => {
                                    if(rememberMe == 'on'){
                                        // Make the cookie last longer if the remember me option was checked
                                        var maxAge = accessToken.lifetime * 60 * 1000;
                                        var expires = accessToken.expiry;
                                        res.cookie('AUTHTOKEN', accessToken.id, {
                                            domain: 'besterintranet.' + Util.get_tld(),
                                            maxAge: maxAge,
                                            expires: expires,
                                            httpOnly: true,
                                            secure: true,
                                            signed: true
                                        });
                                    } else {
                                        res.cookie('AUTHTOKEN', accessToken.id, {
                                            domain: 'besterintranet.' + Util.get_tld(),
                                            httpOnly: true,
                                            secure: true,
                                            signed: true
                                        });
                                    }

                                    if(req.query.continue === undefined){
                                        res.redirect(301, 'https://www.besterintranet.' + Util.get_tld() + "/?nc=1");
                                    } else {
                                        res.redirect(301, decodeURIComponent(req.query.continue));
                                    }
                                }, err => {
                                    renderError("Error logging you in. Please try again")
                                });
                            } else {
                                renderError("Error logging you in. Please try again");
                            }
                        }, err => {
                            renderError("Error logging you in. Please try again");
                        });
                    }
                }, err => {
                    renderError("Your username or password is incorrect");
                });
            }, err => {
                renderError("Your username or password is incorrect");
            });
        } else {
            renderError("Error logging you in. Please try again");
        }
    }, err => {
        renderError("Error logging you in. Please try again");
    });
}

exports.showPasswordConfirmationPage = (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    const renderPasswordConfirmationPage = () => {
        Nonce.createNonce('user-password-confirm', req.path).then(result => {
            res.render('password-confirm', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/password-confirm-page.js'
                ],
                title: 'Confirm it\'s you',
                message: 'Confirm it\'s you',
                email: res.locals.user.email_address,
                nonce: result
            });
        });
    }

    if(req.signedCookies['SATOKEN'] !== undefined){
        const accessToken = new AccessToken(null, null, req.signedCookies['SATOKEN']);
        accessToken.table = 'sudo_access_tokens';
        accessToken.checkToken().then(result => {
            if(result == true){
                next();
            } else {
                renderPasswordConfirmationPage();
            }
        }, err => {
            renderPasswordConfirmationPage();
        });
    } else {
        renderPasswordConfirmationPage();
    }
}

exports.checkPassword = (req, res, next) => {
    const user = res.locals.user;

    const renderError = (error) => {
        Nonce.createNonce('user-password-confirm', req.path).then(result => {
            res.render('password-confirm', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/password-confirm-page.js'
                ],
                title: 'Confirm it\'s you',
                message: 'Confirm it\'s you',
                error: error,
                email: user.email_address,
                nonce: result
            });
        });
    }

    const password = req.body.password;

    if(password === undefined || password == ''){
        renderError("Your password is incorrect");
    }

    const nonce = req.body.nonce;
    Nonce.verifyNonce('user-password-confirm', nonce, req.path).then(result => {
        if(result == true){
            Auth.readPasswordFromDatabase(user.email_address).then(result => {
                // Verify the password
                Auth.verifyPassword(password, {
                    all: result
                }).then(result => {
                    if(result == false){
                        renderError("Your password is incorrect");
                    } else {
                        const accessToken = new AccessToken(user.user_id, 30);
                        accessToken.table = 'sudo_access_tokens';

                        accessToken.saveTokenToDatabase().then(result => {
                            res.cookie('SATOKEN', accessToken.id, {
                                domain: 'accounts.besterintranet.' + Util.get_tld(),
                                httpOnly: true,
                                secure: true,
                                signed: true
                            });

                            const fullUrl = req.protocol + '://' + Util.url_rewrite(req.get('host'), req.url);
                            res.redirect(301, fullUrl);
                        }, err => {
                            renderError("Error confirming your identity. Please try again.")
                        });
                    }
                }, err => {
                    renderError("Your username or password is incorrect");
                });
            }, err => {
                renderError("Your username or password is incorrect");
            });
        } else {
            renderError("Error logging you in. Please try again");
        }
    }, err => {
        renderError("Error logging you in. Please try again");
    });
}

exports.logout = (req, res, next) => {
    Nonce.verifyNonce('user-logout', req.query.nonce, req.path).then(result => {
        if(result == true){
            if(req.signedCookies['AUTHTOKEN'] === undefined){
                res.redirect(301, 'https://www.besterintranet.' + Util.get_tld() + '/?nc=1');
            } else {
                const accessToken = new AccessToken(null, null, req.signedCookies['AUTHTOKEN']);
                accessToken.deleteToken().then(result => {
                    res.clearCookie('AUTHTOKEN', {domain: 'besterintranet.' + Util.get_tld(), httpOnly: true, secure: true, signed: true});
                    res.redirect(301, 'https://www.besterintranet.' + Util.get_tld() + '/?nc=1');
                }, err => {
                    res.clearCookie('AUTHTOKEN', {domain: 'besterintranet.' + Util.get_tld(), httpOnly: true, secure: true, signed: true});
                    res.redirect(301, 'https://www.besterintranet.' + Util.get_tld() + '/?nc=1');
                })
            }
        } else {
            res.render('error-custom', {useBootstrap: false, title: "Error", error: {
                title: "Cannot log you out",
                message: "The nonce verification has failed"
            }});
        }
    }, err => {
        res.render('error-custom', {useBootstrap: false, title: "Error", error: {
            title: "Cannot log you out",
            message: "The nonce verification has failed"
        }});
    });    
}

exports.userCheck = (req, res, next) => {
    // Disable cache
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    const fullUrl = req.protocol + '://' + Util.url_rewrite(req.get('host'), req.url);

    if(req.signedCookies['AUTHTOKEN'] === undefined){
        res.redirect(301, 'https://accounts.besterintranet.' + Util.get_tld() + '/login/?continue=' + encodeURIComponent(fullUrl));
    } else {
        const accessToken = new AccessToken(null, null, req.signedCookies['AUTHTOKEN']);
        accessToken.checkToken().then(result => {
            if(result == true){
                const user = new User(accessToken.user_id);
                user.verifyUser().then(result => {
                    if (result == true) {
                        user.loadInfo().then(result => {
                            res.locals.user = user;
                            next();
                        }, err => {
                            next();
                        });
                    } else {
                        res.redirect(301, 'https://accounts.besterintranet.' + Util.get_tld() + '/login/?continue=' + encodeURIComponent(fullUrl));
                    }
                }, err => {
                    res.redirect(301, 'https://accounts.besterintranet.' + Util.get_tld() + '/login/?continue=' + encodeURIComponent(fullUrl));
                });
            } else {
                res.redirect(301, 'https://accounts.besterintranet.' + Util.get_tld() + '/login/?continue=' + encodeURIComponent(fullUrl));
            }
        }, err => {
            res.redirect(301, 'https://accounts.besterintranet.' + Util.get_tld() + '/login/?continue=' + encodeURIComponent(fullUrl));
        });
    }
}

exports.userLoggedIn = (req, res, next) => {
    const returnStatus = (status) => {
        res.json({
            status: status
        });
    }

    // Disable cache
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    if(req.signedCookies['AUTHTOKEN'] === undefined) {
        returnStatus(false);
    } else {
        const accessToken = new AccessToken(null, null, req.signedCookies['AUTHTOKEN']);
        accessToken.checkToken().then(result => {
            if (result == true) {
                const user = new User(accessToken.user_id);
                user.verifyUser().then(result => {
                    if (result == true) {
                        user.loadInfo().then(result => {
                            returnStatus(true)
                        }, err => {
                            returnStatus(false);
                        });
                    } else {
                        returnStatus(false);
                    }
                }, err => {
                    returnStatus(false);
                });
            } else {
                returnStatus(false);
            }
        }, err => {
            returnStatus(false);
        });
    }
}

exports.showMyAccountPage = (req, res, next) => {
    Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {
        res.render('myaccount-home', {
            useBootstrap: false,
            scriptsAfter: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'My Account',
            logoutNonce: result,
            activeItem: 'home',
        });
    });
}

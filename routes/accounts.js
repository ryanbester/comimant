/*
Copyright (C) 2019 Ryan Bester
*/

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const argon2 = require('argon2');
const multiparty = require('multiparty');

const Util = require('../core/util');
const { Auth, AccessToken, User, Nonce } = require('../core/auth');
const app = require('../app');

exports.showLoginPage = (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    const renderLoginPage = () => {
        Nonce.createNonce('user-login', '/accounts/login/').then(result => {
            res.render('login', {
                useBootstrap: false,
                scripts: [
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
                scripts: [
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
                                    if(rememberMe == 'true'){
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
                                        res.redirect(301, 'https://www.besterintranet.' + Util.get_tld());
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

exports.showMyAccountPage = (req, res, next) => {
    res.render('myaccount', {
        useBootstrap: false,
        scripts: [],
        title: 'My Account',
        message: 'My Account',
        activeItem: 'home'
    });
}

exports.showMyAccountInformationPage = (req, res, next) => {
    res.render('myaccount', {
        useBootstrap: false,
        scripts: [],
        title: 'My Account',
        message: 'My Account',
        activeItem: 'information'
    });
}

exports.showMyAccountSecurityPage = (req, res, next) => {
    res.render('myaccount', {
        useBootstrap: false,
        scripts: [],
        title: 'My Account',
        message: 'My Account',
        activeItem: 'security'
    });
}

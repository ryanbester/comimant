/*
 * Copyright (C) 2019 - 2020 Comimant
 */

const { Sanitizer } = require('../../core/sanitizer');
const { AccessToken } = require('../../core/auth/access-token');
const { User } = require('../../core/auth/user');
const { Config } = require('../../core/config');
const { Util } = require('../../core/util');
const { Auth } = require('../../core/auth/auth');
const { Nonce } = require('../../core/auth/nonce');

exports.showLoginPage = (req, res) => {
    res.set('Cache-Control', 'no-store');

    const renderLoginPage = () => {
        Nonce.createNonce('user-login', '/accounts/login').then(nonce => {
            res.render('accounts/login', {
                stylesheets: [
                    Util.getProtocol() + res.locals.mainDomain + '/stylesheets/login.css'
                ],
                scriptsAfter: [
                    Util.getProtocol() + res.locals.mainDomain + '/scripts/login-page.js'
                ],
                title: 'Login',
                message: Util.coalesceString(Config.getInstance().getOption('messages.login'), 'Login to Comimant'),
                nonce: nonce
            });
        });
    };

    if (req.signedCookies['AUTHTOKEN'] !== undefined) {
        const accessToken = new AccessToken(undefined, undefined, req.signedCookies['AUTHTOKEN']);
        accessToken.checkToken().then(_ => {
            const user = new User(accessToken.user_id);
            user.verifyUser().then(_ => {
                res.redirect(Util.getProtocol() + res.locals.mainDomain);
            }, _ => {
                renderLoginPage();
            });
        }, _ => {
            renderLoginPage();
        });
    } else {
        renderLoginPage();
    }
};

exports.performLogin = (req, res) => {
    const renderError = (error) => {
        Nonce.createNonce('user-login', '/accounts/login').then(nonce => {
            res.render('accounts/login', {
                stylesheets: [
                    Util.getProtocol() + res.locals.mainDomain + '/stylesheets/login.css'
                ],
                scriptsAfter: [
                    Util.getProtocol() + res.locals.mainDomain + '/scripts/login-page.js'
                ],
                title: 'Login',
                message: Util.coalesceString(Config.getInstance().getOption('messages.login'), 'Login to Comimant'),
                error: error,
                username: username,
                emailDomain: emailDomain,
                nonce: nonce
            });
        });
    };

    let { username, emailDomain, password, remember_me: rememberMe, nonce } = req.body;

    username = Sanitizer.string(username);
    emailDomain = Sanitizer.string(emailDomain);
    password = Sanitizer.string(password);

    if (!username) {
        renderError('Your username or password is incorrect');
    }

    if (!emailDomain) {
        renderError('Your username or password is incorrect');
    }

    if (!password) {
        renderError('Your username or password is incorrect');
    }

    if (rememberMe !== 'on') {
        rememberMe = undefined;
    }

    Nonce.verifyNonce('user-login', nonce, Util.getFullPath(req.originalUrl)).then(_ => {
        Auth.readPasswordFromDatabase(username + emailDomain).then(result => {
            // Verify the password
            Auth.verifyPassword(password, {
                all: result
            }).then(result => {
                const user = result;

                user.loadInfo().then(_ => {
                    // If authentication is successful, generate an access token
                    const accessToken = new AccessToken(user.user_id);

                    accessToken.saveTokenToDatabase().then(_ => {
                        if (rememberMe === 'on') {
                            // Make the cookie last longer if the remember me option was checked
                            const maxAge = accessToken.lifetime * 60 * 1000;
                            const expires = accessToken.expiry;
                            res.cookie('AUTHTOKEN', accessToken.id, {
                                domain: res.locals.rootDomain,
                                maxAge: maxAge,
                                expires: expires,
                                httpOnly: true,
                                secure: true,
                                signed: true
                            });
                        } else {
                            res.cookie('AUTHTOKEN', accessToken.id, {
                                domain: res.locals.rootDomain,
                                httpOnly: true,
                                secure: true,
                                signed: true
                            });
                        }

                        if (req.query.continue === undefined) {
                            res.redirect(301, Util.getProtocol() + res.locals.mainDomain + '/?nc=1');
                        } else {
                            res.redirect(301, decodeURIComponent(req.query.continue));
                        }
                    }, _ => {
                        renderError('Your username or password is incorrect');
                    });
                }, _ => {
                    renderError('Your username or password is incorrect');
                });
            }, _ => {
                renderError('Your username or password is incorrect');
            });
        }, _ => {
            renderError('Your username or password is incorrect');
        });
    }, _ => {
        renderError('Your username or password is incorrect');
    });
};
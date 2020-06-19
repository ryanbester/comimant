/*
 * Comimant
 * Copyright (C) 2019 - 2020 Ryan Bester
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
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
        let error = req.query.error;
        if (error !== undefined) {
            error = Sanitizer.string(error);
        }
        let errorMsg;
        switch (error) {
            case 'account_locked':
                errorMsg = 'Your account is locked';
                break;
        }

        const emailDomains = Config.getInstance().getOption('email_domains');
        Nonce.createNonce('user-login', '/accounts/login').then(nonce => {
            res.render('accounts/login', {
                stylesheets: [
                    res.locals.protocol + res.locals.mainDomain + '/stylesheets/login.css'
                ],
                scriptsAfter: [
                    res.locals.protocol + res.locals.mainDomain + '/scripts/login-page.js'
                ],
                title: 'Login',
                message: Util.coalesceString(Config.getInstance().getOption('messages.login'), 'Login to Comimant'),
                emailDomains: (emailDomains === null ? undefined : emailDomains),
                nonce: nonce,
                error: errorMsg
            });
        });
    };

    if (req.signedCookies['AUTHTOKEN'] !== undefined) {
        const accessToken = new AccessToken(undefined, undefined, req.signedCookies['AUTHTOKEN']);
        accessToken.checkToken().then(_ => {
            const user = new User(accessToken.user_id);
            user.verifyUser().then(_ => {
                user.loadInfo().then(_ => {
                    if (user.locked) {
                        renderLoginPage();
                        return;
                    }

                    res.redirect(res.locals.protocol + res.locals.mainDomain);
                }, _ => {
                    renderLoginPage();
                });
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
        const emailDomains = Config.getInstance().getOption('email_domains');
        Nonce.createNonce('user-login', '/accounts/login').then(nonce => {
            res.render('accounts/login', {
                stylesheets: [
                    res.locals.protocol + res.locals.mainDomain + '/stylesheets/login.css'
                ],
                scriptsAfter: [
                    res.locals.protocol + res.locals.mainDomain + '/scripts/login-page.js'
                ],
                title: 'Login',
                message: Util.coalesceString(Config.getInstance().getOption('messages.login'), 'Login to Comimant'),
                emailDomains: (emailDomains === null ? undefined : emailDomains),
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
        return;
    }

    if (!emailDomain) {
        renderError('Your username or password is incorrect');
        return;
    }

    if (!password) {
        renderError('Your username or password is incorrect');
        return;
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
                    if (user.locked) {
                        renderError('Your account is locked');
                        return;
                    }

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
                            res.redirect(301, res.locals.protocol + res.locals.mainDomain + '?nc=1');
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
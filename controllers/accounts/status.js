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

const { AccessToken } = require('../../core/auth/access-token');
const { User } = require('../../core/auth/user');
const { Util } = require('../../core/util');

const logout = require('./logout');

exports.userCheck = (req, res, next) => {
    res.set('Cache-Control', 'no-store');

    const fullUrl = res.locals.protocol + req.hostname + req.path;
    // FIXME: Redirects

    if (req.signedCookies['AUTHTOKEN'] === undefined) {
        res.redirect(301,
            res.locals.accountsProtocol + res.locals.accountsDomain + '/login?continue=' + encodeURIComponent(fullUrl));
    } else {
        const accessToken = new AccessToken(undefined, undefined, req.signedCookies['AUTHTOKEN']);
        accessToken.checkToken().then(_ => {
            const user = new User(accessToken.user_id);
            user.verifyUser().then(_ => {
                user.loadInfo().then(_ => {
                    if (user.locked) {
                        logout.deleteToken(req, res);
                        res.redirect(301,
                            res.locals.accountsProtocol + res.locals.accountsDomain + '/login?error=account_locked&continue=' + encodeURIComponent(
                            fullUrl));
                    } else {
                        user.loadPrivileges().then(_ => {
                            res.locals.user = user;
                            next();
                        }, _ => {
                            res.redirect(301,
                                res.locals.accountsProtocol + res.locals.accountsDomain + '/login?continue=' + encodeURIComponent(
                                fullUrl));
                        });
                    }
                }, _ => {
                    res.redirect(301,
                        res.locals.accountsProtocol + res.locals.accountsDomain + '/login?continue=' + encodeURIComponent(
                        fullUrl));
                });
            }, _ => {
                res.redirect(301,
                    res.locals.accountsProtocol + res.locals.accountsDomain + '/login?continue=' + encodeURIComponent(
                    fullUrl));
            });
        }, _ => {
            res.redirect(301,
                res.locals.accountsProtocol + res.locals.accountsDomain + '/login?continue=' + encodeURIComponent(
                fullUrl));
        });
    }
};

exports.userLoggedIn = (req, res, next) => {
    const returnStatus = status => {
        res.json({
            status: status
        });
    };

    res.set('Cache-Control', 'no-store');

    if (req.signedCookies['AUTHTOKEN'] === undefined) {
        returnStatus(false);
    } else {
        const accessToken = new AccessToken(undefined, undefined, req.signedCookies['AUTHTOKEN']);
        accessToken.checkToken().then(result => {
            const user = new User(accessToken.user_id);
            user.verifyUser().then(result => {
                returnStatus(true);
            }, err => {
                returnStatus(false);
            });
        }, err => {
            returnStatus(false);
        });
    }
};

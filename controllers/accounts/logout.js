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

const { Nonce } = require('../../core/auth/nonce');
const { AccessToken } = require('../../core/auth/access-token');
const { Util } = require('../../core/util');

exports.logout = (req, res) => {
    Nonce.verifyNonce('user-logout', req.query.nonce, Util.getFullPath(req.originalUrl)).then(_ => {
        if (req.signedCookies['AUTHTOKEN'] === undefined) {
            res.redirect(301, res.locals.protocol + res.locals.mainDomain + '?nc=1');
        } else {
            const accessToken = new AccessToken(undefined, undefined, req.signedCookies['AUTHTOKEN']);
            accessToken.deleteToken().then(_ => {
                res.clearCookie('AUTHTOKEN',
                    { domain: res.locals.rootDomain, httpOnly: true, secure: true, signed: true });
                res.redirect(301, res.locals.protocol + res.locals.mainDomain + '?nc=1');
            }, _ => {
                res.clearCookie('AUTHTOKEN',
                    { domain: res.locals.rootDomain, httpOnly: true, secure: true, signed: true });
                res.redirect(301, res.locals.protocol + res.locals.mainDomain + '?nc=1');
            });
        }
    }, _ => {
        res.render('error-custom', {
            title: 'Error',
            error: {
                title: 'Cannot log you out',
                message: 'The nonce verification has failed'
            }
        });
    });
};

exports.deleteToken = (req, res) => {
    if (req.signedCookies['AUTHTOKEN'] !== undefined) {
        const accessToken = new AccessToken(undefined, undefined, req.signedCookies['AUTHTOKEN']);
        accessToken.deleteToken();

        res.clearCookie('AUTHTOKEN',
            { domain: res.locals.rootDomain, httpOnly: true, secure: true, signed: true });
    }
};
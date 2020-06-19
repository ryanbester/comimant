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
const { User } = require('../../core/auth/user');
const { Util } = require('../../core/util');

exports.showHomePage = (req, res) => {
    const renderHomePage = (nonce) => {
        res.render('home', {
            logoutNonce: nonce,
            stylesheets: [
                res.locals.protocol + res.locals.mainDomain + '/stylesheets/home.css'
            ],
            scriptsBefore: [
                res.locals.protocol + res.locals.mainDomain + '/scripts/home/grid.js',
                res.locals.protocol + res.locals.mainDomain + '/scripts/home/widget.js',
                res.locals.protocol + res.locals.mainDomain + '/scripts/home/add-widget-dialog.js',
                res.locals.protocol + res.locals.mainDomain + '/scripts/home/edit-widget-dialog.js',
                res.locals.protocol + res.locals.mainDomain + '/scripts/home/home.js'
            ]
        });
    };

    Nonce.createNonce('user-logout', '/accounts/logout').then(nonce => {
        res.set('Cache-Control', 'no-store');

        if (req.signedCookies['AUTHTOKEN'] === undefined) {
            renderHomePage(nonce);
        } else {
            const accessToken = new AccessToken(undefined, undefined, req.signedCookies['AUTHTOKEN']);
            accessToken.checkToken().then(_ => {
                const user = new User(accessToken.user_id);
                user.verifyUser().then(_ => {
                    user.loadInfo().then(_ => {
                        res.locals.user = user;
                        renderHomePage(nonce);
                    }, _ => {
                        renderHomePage(nonce);
                    });
                }, _ => {
                    renderHomePage(nonce);
                });
            }, _ => {
                renderHomePage(nonce);
            });
        }
    });
};
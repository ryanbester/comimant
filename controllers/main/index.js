/*
 * Copyright (C) 2019 - 2020 Comimant
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
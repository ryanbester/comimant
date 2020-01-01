/*
Copyright (C) 2019-2020 Bester Intranet
*/

const express = require('express');

const Util = require('../../../core/util');
const { Auth, AccessToken, User, Nonce } = require('../../../core/auth');
const app = require('../../../app');

module.exports.userCheck = (req, res, next) => {
    // Disable cache
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    const unauthorisedError = _ => {
        res.status(401).json({
            error: {
                code: 401,
                status: 'Unauthorised',
                message: 'Unauthorised'
            }
        });
    }

    if(req.signedCookies['AUTHTOKEN'] === undefined){
        unauthorisedError();
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
                        unauthorisedError();
                    }
                }, err => {
                    unauthorisedError();
                });
            } else {
                unauthorisedError();
            }
        }, err => {
            unauthorisedError();
        });
    }
}
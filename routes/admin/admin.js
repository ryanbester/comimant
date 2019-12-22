/*
Copyright (C) 2019 Bester Intranet
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

                            var path;
                            if(process.env.NODE_ENV == 'development'){
                                path = 'dev';
                            } else {
                                path = 'prod';
                            }

                            require('child_process').exec('cd ' + path + ' && git rev-parse HEAD', function(err, stdout) {
                                if(err){
                                    res.locals.commit_id = "Not available"
                                } else {
                                    res.locals.commit_id = stdout;
                                }
                            });

                            if(!user.hasPrivilege('access_admin_panel')){
                                res.render('error-custom', {
                                    useBootstrap: false,
                                    title: "Permission Denied",
                                    error: {
                                        title: "Permission Denied",
                                        message: "You do not have permission to access this page. Please contact your administrator."
                                    }
                                });
                            } else {
                                next();
                            }
                        }, err => {
                            res.render('error-custom', {
                                useBootstrap: false,
                                title: "Permission Denied",
                                error: {
                                    title: "Permission Denied",
                                    message: "You do not have permission to access this page. Please contact your administrator."
                                }
                            });
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

exports.showAdminPanel = (req, res, next) => {
    Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {
        res.render('admin-home', {
            useBootstrap: false,
            scripts: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
            ],
            title: 'Admin',
            logoutNonce: result,
            activeItem: 'home',
        });
    });
}
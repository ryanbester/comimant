/*
Copyright (C) 2019-2020 Bester Intranet
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
const { FilesManager, FileLocation, FileIterator } = require('../core/files');


exports.showFileLocationsPage = (req, res, next) => {
    // Disable cache
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    Nonce.createNonce('user-logout', '/accounts/logout').then(nonce => {
        res.render('files-locations', {
            useBootstrap: false,
            tld: Util.get_tld(),
            logoutNonce: nonce,
            scriptsBefore: [
                'https://' + res.locals.main_domain + '/scripts/files.js'
            ]
        });  
    });
}

exports.showFilesPage = (req, res, next) => {
    // Disable cache
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    FilesManager.getFileLocations();
    const location = FilesManager.getLocationForName(req.params.location);
    
    var locationTitle = req.params.location;
    if (location) {
        locationTitle = location.title;
    }

    Nonce.createNonce('user-logout', '/accounts/logout').then(nonce => {
        res.render('files-files', {
            useBootstrap: false,
            tld: Util.get_tld(),
            logoutNonce: nonce,
            scriptsBefore: [
                'https://' + res.locals.main_domain + '/scripts/files.js'
            ],
            currentLocation: locationTitle,
            currentPath: req.path.replace('/files/' + req.params.location, '')
        });  
    });
}
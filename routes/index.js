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

const express = require('express');

const { Util } = require('../core/util');
const { Domains } = require('../core/domains');
const { Config } = require('../core/config');
const { Nonce } = require('../core/auth/nonce');
const { User } = require('../core/auth/user');
const { AccessToken } = require('../core/auth/access-token');

const app = require('../app');
const router = express.Router();

const accountRoutes = require('./accounts');
const apiRoutes = require('./api');
const homeRoutes = require('./home');
const adminRoutes = require('./admin');

const securityController = require('../controllers/security');
const manifestController = require('../controllers/manifest');
const accountStatus = require('../controllers/accounts/status');

// Load domains and other metadata from configuration
router.all('*', ((req, res, next) => {
    let domain = new Domains(req.hostname);

    res.locals.mainDomainObj = domain.getMainDomain();
    res.locals.authDomainObj = domain.getAuthDomain();
    res.locals.staticDomainObj = domain.getStaticDomain();
    res.locals.accountsDomainObj = domain.getAccountsDomain();

    // Domains
    res.locals.rootDomain = domain.getRootDomain().domain;
    res.locals.mainDomain = res.locals.mainDomainObj.domain;
    res.locals.authDomain = res.locals.authDomainObj.domain;
    res.locals.staticDomain = res.locals.staticDomainObj.domain;
    res.locals.accountsDomain = res.locals.accountsDomainObj.domain;

    res.locals.protocol = Util.getProtocol(res.locals.mainDomainObj);
    res.locals.authProtocol = Util.getProtocol(res.locals.authDomainObj);
    res.locals.staticProtocol = Util.getProtocol(res.locals.staticDomainObj);
    res.locals.accountsProtocol = Util.getProtocol(res.locals.accountsDomainObj);

    if (req.hostname === res.locals.mainDomain) {
        res.locals.sendManifest = true;
        res.locals.sendSw = true;
    }

    const config = Config.getInstance();
    res.locals.keywords = Util.coalesceString(config.getOption('keywords'), 'comimant');
    res.locals.description = Util.coalesceString(config.getOption('description'), 'Comimant');
    res.locals.copyright = Util.coalesceString(config.getOption('copyright'), '© 2017–%year% Comimant')
        .replace('%year%', new Date().getFullYear().toString());

    next();
}));

// Extra security layer if things like JWT are enabled
router.all('*', securityController.processLayers);

// Register API routes
router.use('/api', apiRoutes);

// Register manifest controller
router.get('/manifest.webmanifest', manifestController.loadManifest);

// Accounts routes
router.use('/accounts', accountRoutes);

// Usercheck route
router.get('/usercheck', accountStatus.userLoggedIn);

// Home routes
router.use('/', homeRoutes);

// Admin routes
router.use('/admin', adminRoutes);

module.exports = router;
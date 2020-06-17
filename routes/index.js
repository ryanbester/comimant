/*
 * Copyright (C) 2019 - 2020 Comimant
 */

const express = require('express');

const { Util } = require('../core/util');
const { Domains } = require('../core/domains');
const { Config } = require('../core/config');

const app = require('../app');
const router = express.Router();

const accountRoutes = require('./accounts');
const apiRoutes = require('./api');

const manifestController = require('../controllers/manifest');

router.use('/api', apiRoutes);

router.all('*', ((req, res, next) => {
    let domain = new Domains(req.hostname);
    res.locals.rootDomain = domain.getRootDomain();
    res.locals.mainDomain = domain.getDomain();
    res.locals.authDomain = domain.getAuthDomain();
    res.locals.staticDomain = domain.getStaticDomain();
    res.locals.accountsDomain = domain.getAccountsDomain();

    if (req.hostname === res.locals.mainDomain) {
        res.locals.sendManifest = true;
        res.locals.sendSw = true;
    }

    const config = Config.getInstance();
    res.locals.keywords = Util.coalesceString(config.getOption('keywords'), 'comimant');
    res.locals.description = Util.coalesceString(config.getOption('description'), 'Comimant');

    next();
}));

router.get('/manifest.webmanifest', manifestController.loadManifest);

router.use('/accounts', accountRoutes);

router.get('/', (req, res, next) => {
    res.send('Bester Intranet').end();
});

module.exports = router;
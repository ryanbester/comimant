/*
 * Copyright (C) 2019 - 2020 Bester Intranet
 */

const express = require('express');

const { Util } = require('../core/util');
const { Domains } = require('../core/domains');
const { Config } = require('../core/config');

const app = require('../app');
const router = express.Router();
const apiRoutes = require('./api');

router.use('/api', apiRoutes);

router.all('*', ((req, res, next) => {
    let domain = new Domains(req.hostname);
    res.locals.rootDomain = domain.getRootDomain();
    res.locals.mainDomain = domain.getDomain();
    res.locals.authDomain = domain.getAuthDomain();
    res.locals.staticDomain = domain.getStaticDomain();
    res.locals.accountsDomain = domain.getAccountsDomain();

    next();
}));

router.get('/', (req, res, next) => {
    res.send('Bester Intranet').end();
});

module.exports = router;
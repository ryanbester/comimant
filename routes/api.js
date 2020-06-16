/*
 * Copyright (C) 2019 - 2020 Bester Intranet
 */

const express = require('express');

const { Util } = require('../core/util');
const { Domains } = require('../core/domains');

const app = require('../app');
const router = express.Router();

router.get('/internal', (req, res, next) => {
    res.send("API").end();
});

module.exports = router;
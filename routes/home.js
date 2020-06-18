/*
 * Copyright (C) 2019 - 2020 Comimant
 */

const express = require('express');

const { Util } = require('../core/util');

const app = require('../app');
const router = express.Router();

const home = require('../controllers/main/index');

router.get('/', home.showHomePage);

module.exports = router;
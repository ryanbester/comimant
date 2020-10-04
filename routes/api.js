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

const internalAPIMain = require('../controllers/api/internal/main');
const internalAPIConfig = require('../controllers/api/internal/config');
const internalAPIWidgets = require('../controllers/api/internal/widgets');

const app = require('../app');
const router = express.Router();

// Authorization
router.all('/internal/config', internalAPIMain.userCheck);
router.all('/internal/config/*', internalAPIMain.userCheck);
router.all('/internal/widgets', internalAPIMain.userCheck);
router.all('/internal/widgets/*', internalAPIMain.userCheck);

router.get('/internal/config/domains.js', internalAPIConfig.getDomains);

router.get('/internal/widgets', internalAPIWidgets.getAllWidgets);
router.post('/internal/widgets', internalAPIWidgets.addWidget);

router.get('/internal/widgets/:widgetId', internalAPIWidgets.getWidget);
router.delete('/internal/widgets/:widgetId', internalAPIWidgets.deleteWidget);
router.put('/internal/widgets/:widgetId', internalAPIWidgets.updateWidget);

router.get('/internal', (req, res, next) => {
    res.send('API').end();
});

module.exports = router;

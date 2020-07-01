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
const fs = require('fs');

const { Util } = require('../core/util');

const app = require('../app');
const { Version } = require('../core/version');
const router = express.Router();

const setupMainController = require('../controllers/setup/index');
const setupDatabaseController = require('../controllers/setup/database');
const setupUserController = require('../controllers/setup/user');

router.all('/*', (req, res, next) => {
    const re = /^((([0-9]+)\.([0-9]+)\.([0-9]+)(?:-([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?)(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?)$/m;

    const packageVersionRaw = require('../package.json').version;
    const packageVersionParts = packageVersionRaw.match(re);
    res.locals.setupPackageVersion = {
        major: packageVersionParts[3],
        minor: packageVersionParts[4],
        patch: packageVersionParts[5]
    };

    const filename = __approot + '/version.txt';

    res.locals.setupAction = 'initial';
    res.locals.setupPreviousVersion = null;
    res.locals.setupError = null;

    if (fs.existsSync(filename)) {
        const data = fs.readFileSync(filename);
        if (data.toString() !== '') {
            const parts = data.toString().match(re);
            if (parts == null) {
                res.locals.setupAction = 'error';
                res.locals.setupError = 'Invalid version number';
            } else {
                res.locals.setupPreviousVersion = {
                    major: parts[3],
                    minor: parts[4],
                    patch: parts[5]
                };

                const cmp = Version.compare(res.locals.setupPackageVersion, res.locals.setupPreviousVersion);
                if (cmp === 0) {
                    res.locals.setupAction = 'none';
                } else if (cmp === 1) {
                    res.locals.setupAction = 'upgrade';
                } else {
                    res.locals.setupAction = 'error';
                    res.locals.setupError = 'Installed version newer than package version';
                }
            }
        }
    }

    next();
});

router.get('/', setupMainController.showSetupPage);

router.get('/database', setupDatabaseController.showDatabasePage);
router.post('/database', setupDatabaseController.saveDatabase);

router.get('/user', setupUserController.showUserPage);
router.post('/user', setupUserController.saveUser);

module.exports = router;
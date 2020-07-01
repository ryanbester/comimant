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

const childProcess = require('child_process');

const { Logger } = require('../../core/logger');
const { Nonce } = require('../../core/auth/nonce');
const { AccessToken } = require('../../core/auth/access-token');
const { Util } = require('../../core/util');

exports.showSetupPage = (req, res) => {
    // Show setup page
    switch (res.locals.setupAction) {
        case 'initial':
            res.render('setup/install', {
                title: 'Setup'
            });
            break;
        case 'upgrade':
            res.render('setup/upgrade', {
                title: 'Upgrading Comimant'
            });
            break;
        case 'error':
            res.render('setup/error', {
                title: 'Setup',
                error: 'Error: ' + res.locals.setupError
            });
            break;
        default:
            res.render('setup/no-action', {
                title: 'Setup'
            });
    }
}

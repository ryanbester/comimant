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

exports.showUserPage = (req, res) => {
    if (res.locals.setupAction === 'initial') {
        res.render('setup/install-user', {
            stylesheets: [
                res.locals.protocol + res.locals.mainDomain + '/stylesheets/my-account.css'
            ],
            title: 'Setup'
        });
    } else {
        res.render('setup/no-action', {
            title: 'Setup'
        });
    }
}

exports.saveUser = (req, res) => {
    if (res.locals.setupAction === 'initial') {
        // TODO: Create user
        res.render('setup/install-user', {
            stylesheets: [
                res.locals.protocol + res.locals.mainDomain + '/stylesheets/my-account.css'
            ],
            title: 'Setup',
            success: 'Created user'
        });
    } else {
        res.render('setup/no-action', {
            title: 'Setup'
        });
    }
}

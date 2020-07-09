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

exports.userCheck = (req, res, next) => {
    if (res.locals.user.privileges.hasPrivilege('admin.access_admin_panel')) {
        // Get commit ID
        childProcess.exec('cd ' + __approot + ' && git rev-parse HEAD', function (err, stdout) {
            if (err) {
                res.locals.commitId = 'Not available';
            } else {
                res.locals.commitId = stdout;
            }

            next();
        });
    } else {
        Logger.debug(
            Util.getClientIP(req) + ' tried to access Admin page but did not have permission.');
        res.render('error-custom', {
            title: 'Permission Denied',
            error: {
                title: 'Permission Denied',
                message: 'You do not have permission to access this page. Please contact your administrator.'
            }
        });
    }
};

exports.showAdminPage = (req, res) => {
    Nonce.createNonce('user-logout', '/accounts/logout').then(nonce => {
        res.render('admin/layout', {
            ...res.locals.stdArgs,
            title: 'Admin',
            logoutNonce: nonce,
            activeItem: 'home'
        });
    });
};

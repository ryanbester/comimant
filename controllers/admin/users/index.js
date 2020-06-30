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

const { Logger } = require('../../../core/logger');
const { AuthUtil } = require('../../../core/auth/auth-util');
const { Nonce } = require('../../../core/auth/nonce');
const { Util } = require('../../../core/util');

exports.showUsersPage = (req, res) => {
    Nonce.createNonce('user-logout', '/accounts/logout').then(nonce => {
        res.locals.user.hasPrivilege('admin.users.list').then(result => {
            if (!result) {
                Logger.debug(
                    Util.getClientIP(req) + ' tried to list users on page admin.users but did not have permission.');
                res.render('admin/users/index', {
                    ...res.locals.stdArgs,
                    title: 'Users | Admin',
                    logoutNonce: nonce,
                    activeItem: 'users',
                    subtitle: 'Users',
                    hasPermission: false
                });
                return;
            }

            AuthUtil.getUsers().then(users => {
                const message = handleMessage(req.query.message);

                res.render('admin/users/index', {
                    ...res.locals.stdArgs,
                    title: 'Users | Admin',
                    logoutNonce: nonce,
                    activeItem: 'users',
                    subtitle: 'Users',
                    hasPermission: true,
                    users: users,
                    message: message
                });
            });

        }, _ => {
            Logger.debug(
                Util.getClientIP(req) + ' tried to list users on page admin.users but did not have permission.');
            res.render('admin/users/index', {
                ...res.locals.stdArgs,
                title: 'Users | Admin',
                logoutNonce: nonce,
                activeItem: 'users',
                subtitle: 'Users',
                hasPermission: false
            });
        });
    });
};

const handleMessage = (messageID) => {
    if (messageID !== undefined) {
        switch (messageID) {
            case 'user_deleted':
                return 'The user has been successfully deleted';
        }
    }

    return undefined;
}

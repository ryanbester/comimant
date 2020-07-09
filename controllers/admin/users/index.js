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

const querystring = require('querystring');
const { ViewOptions } = require('../../../core/view-options');

const { Logger } = require('../../../core/logger');
const { AuthUtil } = require('../../../core/auth/auth-util');
const { Nonce } = require('../../../core/auth/nonce');
const { Util } = require('../../../core/util');
const { Sanitizer } = require('../../../core/sanitizer');

exports.showUsersPage = (req, res) => {
    Nonce.createNonce('user-logout', '/accounts/logout').then(nonce => {
        if (!res.locals.user.privileges.hasPrivilege('admin.users.list')) {
            Logger.debug(
                Util.getClientIP(req) + ' tried to list users on page admin.users but did not have permission.');
            res.render('admin/users/index', {
                ...res.locals.stdArgs,
                title: 'Users | Admin',
                logoutNonce: nonce,
                activeItem: 'users',
                subtitle: 'Users'
            });
            return;
        }

        AuthUtil.countUsers().then(userCount => {
            let viewOptions = {
                columns: {
                    'first_name': {
                        title: 'First Name',
                        sortable: true,
                        filterable: true,
                        visible: true
                    },
                    'last_name': {
                        title: 'Last Name',
                        sortable: true,
                        filterable: true,
                        visible: true
                    },
                    'email_address': {
                        title: 'Email Address',
                        sortable: true,
                        filterable: true,
                        visible: true
                    },
                    'locked': {
                        title: 'Locked',
                        sortable: true,
                        filterable: true
                    },
                    'date_added': {
                        title: 'Date Added',
                        sortable: true,
                        filterable: true
                    }
                }
            };

            ViewOptions.processQueryParams(viewOptions, Util.getFullPath(req.originalUrl), req.query, 20,
                userCount);

            AuthUtil.getUsers(viewOptions)
                .then(users => {
                    const message = handleMessage(req.query.message);

                    res.render('admin/users/index', {
                        ...res.locals.stdArgs,
                        title: 'Users | Admin',
                        logoutNonce: nonce,
                        activeItem: 'users',
                        subtitle: 'Users',
                        users: users,
                        message: message,
                        viewOptions: viewOptions
                    });
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
};

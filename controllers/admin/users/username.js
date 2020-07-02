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

const { User } = require('../../../core/auth/user');
const { Sanitizer } = require('../../../core/sanitizer');
const { Logger } = require('../../../core/logger');
const { Nonce } = require('../../../core/auth/nonce');
const { Util } = require('../../../core/util');

const renderPage = (req, res, hasPermission, error, invalidFields, username, success) => {
    let noncePromises = [
        Nonce.createNonce('user-logout', '/accounts/logout'),
        Nonce.createNonce('admin-users-user-username-form',
            '/admin/users/' + res.locals.targetUser.user_id.toLowerCase() + '/username')
    ];

    Promise.all(noncePromises).then(results => {
        const [logoutNonce, formNonce] = results;

        res.render('admin/users/username', {
            ...res.locals.stdArgs,
            title: 'Username | Users | Admin',
            logoutNonce: logoutNonce,
            formNonce: formNonce,
            activeItem: 'users',
            subtitle: 'Username | ' + res.locals.targetUser.first_name + ' ' + res.locals.targetUser.last_name,
            showBack: true,
            backUrl: '../' + res.locals.targetUser.user_id.toLowerCase(),
            error: error,
            success: success,
            hasPermission: hasPermission,
            username: username === undefined ? res.locals.targetUser.username : username,
            usernameInvalid: invalidFields !== undefined ? invalidFields.includes('username') : false
        });
    });
};

exports.showUsernamePage = (req, res) => {
    res.locals.user.hasPrivilege('admin.users.change_username').then(result => {
        if (result === true) {
            renderPage(req, res, true);
        } else {
            Logger.debug(
                Util.getClientIP(
                    req) + ' tried to access page admin.users.change_username but did not have permission.');
            renderPage(req, res, false);
        }
    }, _ => {
        Logger.debug(
            Util.getClientIP(req) + ' tried to access page admin.users.change_username but did not have permission.');
        renderPage(req, res, false);
    });
};

exports.changeUsername = (req, res) => {
    res.locals.user.hasPrivilege('admin.users.change_username').then(result => {
        if (!result) {
            Logger.debug(
                Util.getClientIP(
                    req) + ' tried to access page admin.users.change_username but did not have permission.');
            renderPage(req, res, false);
            return;
        }

        let targetUser = res.locals.targetUser;
        let { username, nonce } = req.body;

        Nonce.verifyNonce('admin-users-user-username-form', nonce, Util.getFullPath(req.originalUrl)).then(_ => {
            username = Sanitizer.ascii(Sanitizer.whitespace(Sanitizer.string(username)));

            let invalidFields = [];
            if (!username) {
                invalidFields.push('username');
            }

            if (invalidFields.length > 0) {
                renderPage(req, res, true, invalidFields.length + ' fields are invalid', invalidFields, username);
                return;
            }

            const performSave = () => {
                targetUser.username = username;

                targetUser.saveUser().then(_ => {
                    renderPage(req, res, true, undefined, undefined, username, 'Successfully saved your username');
                }, _ => {
                    Logger.debug(
                        Util.getClientIP(
                            req) + ' tried to save admin.users.change_username but failed to save to database.');
                    renderPage(req, res, true, 'Error saving the user\'s username. Please try again.', undefined,
                        username);
                });
            };

            // Check if username is taken
            if (username !== targetUser.username) {
                User.usernameTaken(username).then(result => {
                    if (result === true) {
                        Logger.debug(
                            Util.getClientIP(
                                req) + ' tried to save admin.users.change_username but their username was taken.');
                        renderPage(req, res, true, 'Please check the username and try again.', ['username'],
                            username);
                        return;
                    }

                    performSave();
                });
            } else {
                performSave();
            }
        }, _ => {
            Logger.debug(
                Util.getClientIP(
                    req) + ' tried to access page admin.users.change_username but nonce verification failed.');
            renderPage(req, res, true, 'Error saving the user\'s username. Please try again.');
        });
    }, _ => {
        Logger.debug(
            Util.getClientIP(req) + ' tried to access page admin.users.change_username but did not have permission.');
        renderPage(req, res, false);
    });

};
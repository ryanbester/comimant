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

const { User } = require('../../../../core/auth/user');
const { Logger } = require('../../../../core/logger');
const { Sanitizer } = require('../../../../core/sanitizer');
const { Util } = require('../../../../core/util');
const { Nonce } = require('../../../../core/auth/nonce');

const renderPage = (req, res, error, invalidFields, username, success) => {
    let noncePromises = [
        Nonce.createNonce('user-logout', '/accounts/logout'),
        Nonce.createNonce('myaccount-my-info-username-form', '/accounts/myaccount/my-info/username')
    ];

    Promise.all(noncePromises).then(nonces => {
        const [logoutNonce, formNonce] = nonces;

        res.render('accounts/my-account/my-info/username', {
            ...res.locals.stdArgs,
            title: 'Username | My Information | My Account',
            logoutNonce: logoutNonce,
            formNonce: formNonce,
            activeItem: 'my-info',
            subtitle: 'Username',
            showBack: true,
            backUrl: '../my-info',
            error: error,
            success: success,
            username: username === undefined ? res.locals.user.username : username,
            usernameInvalid: invalidFields !== undefined ? invalidFields.includes('username') : invalidFields
        });
    });
};

exports.showUsernamePage = (req, res) => {
    if (res.locals.user.privileges.hasPrivilege('account.info.change_username')) {
        if (!result) {
            Logger.debug(
                Util.getClientIP(
                    req) + ' tried to access page account.info.change_username but did not have permission.');
            res.render('error-custom', {
                title: 'Permission Denied',
                error: {
                    title: 'Permission Denied',
                    message: 'You do not have permission to change your username. Please contact your administrator.'
                }
            });
        } else {
            renderPage(req, res);
        }
    } else {
        Logger.debug(
            Util.getClientIP(req) + ' tried to access page account.info.change_username but did not have permission.');
        res.render('error-custom', {
            title: 'Permission Denied',
            error: {
                title: 'Permission Denied',
                message: 'You do not have permission to change your username. Please contact your administrator.'
            }
        });
    }
};

exports.saveUsername = (req, res) => {
    let user = res.locals.user;
    let { username, nonce } = req.body;

    if (user.privileges.hasPrivilege('account.info.change_username')) {
        Nonce.verifyNonce('myaccount-my-info-username-form', nonce, Util.getFullPath(req.originalUrl)).then(_ => {
            username = Sanitizer.ascii(Sanitizer.whitespace(Sanitizer.string(username)));

            let invalidFields = [];
            if (!username) {
                invalidFields.push('username');
            }

            if (invalidFields.length > 0) {
                renderPage(req, res, invalidFields.length + ' fields are invalid', invalidFields, username);
                return;
            }

            const performSave = () => {
                user.username = username;

                user.saveUser().then(_ => {
                    renderPage(req, res, undefined, undefined, username, 'Successfully saved your username');
                }, _ => {
                    Logger.debug(
                        Util.getClientIP(
                            req) + ' tried to save account.info.change_username but failed to save to database.');
                    renderPage(req, res, 'Error saving your username. Please try again.', undefined, username);
                });
            };

            // Check if username is taken
            if (username !== user.username) {
                User.usernameTaken(username).then(result => {
                    if (result === true) {
                        Logger.debug(
                            Util.getClientIP(
                                req) + ' tried to save account.info.change_username but their username was taken.');
                        renderPage(req, res, 'Please check your username and try again', ['username'], username);
                        return;
                    }

                    performSave();
                });
            } else {
                performSave();
            }
        }, _ => {
            Logger.debug(
                Util.getClientIP(req) + ' tried to save account.info.change_username but nonce verification failed.');
            renderPage(req, res, 'Error saving your username. Please try again.');
        });
    } else {
        Logger.debug(
            Util.getClientIP(req) + ' tried to access page account.info.change_username but did not have permission.');
        res.render('error-custom', {
            title: 'Permission Denied',
            error: {
                title: 'Permission Denied',
                message: 'You do not have permission to change your username. Please contact your administrator.'
            }
        });
    }
};

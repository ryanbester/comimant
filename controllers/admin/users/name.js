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

const renderPage = (req, res, hasPermission, error, invalidFields, firstName, lastName, success) => {
    let noncePromises = [
        Nonce.createNonce('user-logout', '/accounts/logout'),
        Nonce.createNonce('admin-users-user-name-form',
            '/admin/users/' + res.locals.targetUser.user_id.toLowerCase() + '/name')
    ];

    Promise.all(noncePromises).then(results => {
        const [logoutNonce, formNonce] = results;

        res.render('admin/users/name', {
            ...res.locals.stdArgs,
            title: 'Name | Users | Admin',
            logoutNonce: logoutNonce,
            formNonce: formNonce,
            activeItem: 'users',
            subtitle: 'Name | ' + res.locals.targetUser.first_name + ' ' + res.locals.targetUser.last_name,
            showBack: true,
            backUrl: '../' + res.locals.targetUser.user_id.toLowerCase(),
            error: error,
            success: success,
            hasPermission: hasPermission,
            firstName: firstName === undefined ? res.locals.targetUser.first_name : firstName,
            lastName: lastName === undefined ? res.locals.targetUser.last_name : lastName,
            firstNameInvalid: invalidFields !== undefined ? invalidFields.includes('firstName') : false,
            lastNameInvalid: invalidFields !== undefined ? invalidFields.includes('lastName') : false
        });
    });
};

exports.showNamePage = (req, res) => {
    res.locals.user.hasPrivilege('admin.users.change_name').then(result => {
        if (result === true) {
            renderPage(req, res, true);
        } else {
            Logger.debug(
                Util.getClientIP(req) + ' tried to access page admin.users.change_name but did not have permission.');
            renderPage(req, res, false);
        }
    }, _ => {
        Logger.debug(
            Util.getClientIP(req) + ' tried to access page admin.users.change_name but did not have permission.');
        renderPage(req, res, false);
    });
};

exports.changeName = (req, res) => {
    res.locals.user.hasPrivilege('admin.users.change_name').then(result => {
        if (!result) {
            Logger.debug(
                Util.getClientIP(req) + ' tried to access page admin.users.change_name but did not have permission.');
            renderPage(req, res, false);
            return;
        }

        let targetUser = res.locals.targetUser;
        let { firstName, lastName, nonce } = req.body;

        Nonce.verifyNonce('admin-users-user-name-form', nonce, Util.getFullPath(req.originalUrl)).then(_ => {
            firstName = Sanitizer.ascii(Sanitizer.whitespace(Sanitizer.string(firstName)));
            lastName = Sanitizer.ascii(Sanitizer.whitespace(Sanitizer.string(lastName)));

            let invalidFields = [];
            if (!firstName) {
                invalidFields.push('firstName');
            }

            if (!lastName) {
                invalidFields.push('lastName');
            }

            if (invalidFields.length > 0) {
                renderPage(req, res, true, invalidFields.length + ' fields are invalid', invalidFields, firstName, lastName);
                return;
            }

            targetUser.first_name = firstName;
            targetUser.last_name = lastName;

            targetUser.saveUser().then(_ => {
                renderPage(req, res, true, undefined, undefined, firstName, lastName, 'Successfully saved the user\'s name');
            }, _ => {
                Logger.debug(
                    Util.getClientIP(req) + ' tried to access page admin.users.change_name but failed to save to database.');
                renderPage(req, res, true, 'Error saving the user\'s name. Please try again.');
            });
        }, _ => {
            Logger.debug(
                Util.getClientIP(req) + ' tried to access page admin.users.change_name but nonce verification failed.');
            renderPage(req, res, true, 'Error saving the user\'s name. Please try again.');
        });
    }, _ => {
        Logger.debug(
            Util.getClientIP(req) + ' tried to access page admin.users.change_name but did not have permission.');
        renderPage(req, res, false);
    });

};
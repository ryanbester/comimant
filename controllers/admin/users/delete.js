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
const { PrivilegeTemplate } = require('../../../core/privileges/privilege-template');
const { PrivilegeTemplates } = require('../../../core/privileges/privilege-templates');
const { Logger } = require('../../../core/logger');
const { Nonce } = require('../../../core/auth/nonce');
const { Auth } = require('../../../core/auth/auth');
const { Util } = require('../../../core/util');

const renderPage = (req, res, error, success) => {
    const targetUser = res.locals.targetUser;

    let noncePromises = [
        Nonce.createNonce('user-logout', '/accounts/logout'),
        Nonce.createNonce('admin-users-delete-user-form',
            '/admin/users/' + targetUser.user_id.toLowerCase() + '/delete-user')
    ];

    Promise.all(noncePromises).then(results => {
        const [logoutNonce, formNonce] = results;

        res.render('admin/users/delete', {
            ...res.locals.stdArgs,
            title: 'Delete User: ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
            logoutNonce: logoutNonce,
            formNonce: formNonce,
            activeItem: 'users',
            subtitle: 'Delete User: ' + targetUser.first_name + ' ' + targetUser.last_name,
            showBack: true,
            backUrl: '../users',
            error: error,
            success: success
        });
    });
};

exports.showDeletePage = (req, res) => {
    renderPage(req, res);
};

exports.deleteUser = (req, res) => {
    let targetUser = res.locals.targetUser;
    let { nonce } = req.body;

    Nonce.verifyNonce('admin-users-delete-user-form', nonce, Util.getFullPath(req.originalUrl)).then(_ => {
        targetUser.deleteUser().then(_ => {
            res.redirect(301, '../../users?message=user_deleted');
        }, _ => {
            Logger.debug(
                Util.getClientIP(
                    req) + ' tried to perform admin.users.delete but failed to delete user from database.');
            renderPage(req, res, 'Error deleting user. Please try again.');
        });
    }, _ => {
        Logger.debug(
            Util.getClientIP(req) + ' tried to perform admin.users.delete but nonce verification failed.');
        renderPage(req, res, 'Error deleting user. Please try again.');
    });
};

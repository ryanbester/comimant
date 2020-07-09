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

const { PrivilegeTemplate } = require('../../../../core/privileges/privilege-template');
const { Privileges } = require('../../../../core/privileges/privileges');
const { User } = require('../../../../core/auth/user');
const { Sanitizer } = require('../../../../core/sanitizer');
const { Logger } = require('../../../../core/logger');
const { Nonce } = require('../../../../core/auth/nonce');
const { Util } = require('../../../../core/util');

const renderPage = (req, res, error, success) => {
    let noncePromises = [
        Nonce.createNonce('user-logout', '/accounts/logout'),
        Nonce.createNonce('admin-users-user-privileges-form',
            '/admin/users/' + res.locals.targetUser.user_id.toLowerCase() + '/security/privileges')
    ];

    Promise.all(noncePromises).then(results => {
        const [logoutNonce, formNonce] = results;

        const privileges = res.locals.targetUser.privileges.getAllPrivilegesFlat();

        res.render('admin/users/privileges/index', {
            ...res.locals.stdArgs,
            title: 'Privileges | Users | Admin',
            logoutNonce: logoutNonce,
            formNonce: formNonce,
            activeItem: 'users',
            subtitle: 'Privileges | ' + res.locals.targetUser.first_name + ' ' + res.locals.targetUser.last_name,
            showBack: true,
            backUrl: '../../' + res.locals.targetUser.user_id.toLowerCase(),
            error: error,
            success: success,
            privileges: privileges
        });
    });
};

exports.showPrivilegesPage = (req, res) => {
    renderPage(req, res);
};

exports.savePrivileges = (req, res) => {
    let targetUser = res.locals.targetUser;
    let { nonce } = req.body;

    Nonce.verifyNonce('admin-users-user-privileges-form', nonce, Util.getFullPath(req.originalUrl)).then(_ => {
        Object.keys(req.body).forEach(name => {
            const newName = Sanitizer.string(name);

            if (!(newName === 'nonce' || newName === undefined || newName === false)) {
                if (req.body[name] === 'granted') {
                    //targetUser.grantPrivilege(newName);
                } else {
                    //targetUser.revokePrivilege(newName);
                }
            }
        });

        targetUser.saveUser().then(_ => {
            renderPage(req, res, undefined, 'Successfully saved the user\'s privileges');
        }, _ => {
            Logger.debug(
                Util.getClientIP(
                    req) + ' tried to access page admin.users.manage_privileges but failed to save to database.');
            renderPage(req, res, 'Error saving the user\'s privileges. Please try again.');
        });
    }, _ => {
        Logger.debug(
            Util.getClientIP(
                req) + ' tried to access page admin.users.manage_privileges but nonce verification failed.');
        renderPage(req, res, 'Error saving the user\'s privileges. Please try again.');
    });

};

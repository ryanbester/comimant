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
const { Logger } = require('../../../core/logger');
const { AuthUtil } = require('../../../core/auth/auth-util');
const { Nonce } = require('../../../core/auth/nonce');
const { Util } = require('../../../core/util');

exports.loadUserInfo = (req, res, next) => {
    const { userId } = req.params;

    const targetUser = new User(userId);
    targetUser.loadInfo().then(_ => {
        res.locals.targetUser = targetUser;
        next();
    }, _ => {
        Nonce.createNonce('user-logout', '/accounts/logout').then(nonce => {
            res.render('admin/users/user', {
                ...res.locals.stdArgs,
                title: 'Unknown User | Users | Admin',
                logoutNonce: nonce,
                activeItem: 'users',
                subtitle: 'Unknown User',
                showBack: true,
                backUrl: '../users'
            });
        });
    });
};

exports.showUserPage = (req, res) => {
    const targetUser = res.locals.targetUser;

    Nonce.createNonce('user-logout', '/accounts/logout').then(nonce => {
        res.locals.user.hasPrivilege('admin.users.view').then(result => {
            if (!result) {
                Logger.debug(
                    Util.getClientIP(req) + ' tried to access page admin.users.user but did not have permission.');
                res.render('admin/users/user', {
                    ...res.locals.stdArgs,
                    title: targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
                    logoutNonce: nonce,
                    activeItem: 'users',
                    subtitle: targetUser.first_name + ' ' + targetUser.last_name,
                    hasPermission: false,
                    showBack: true,
                    backUrl: '../users'
                });
                return;
            }

            targetUser.countGrantedPrivileges().then(privilegeCount => {
                res.render('admin/users/user', {
                    ...res.locals.stdArgs,
                    title: targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
                    logoutNonce: nonce,
                    activeItem: 'users',
                    subtitle: targetUser.first_name + ' ' + targetUser.last_name,
                    hasPermission: true,
                    showBack: true,
                    backUrl: '../users',
                    grantedPrivileges: privilegeCount
                });
            });
        }, _ => {
            Logger.debug(
                Util.getClientIP(req) + ' tried to access page admin.users.user but did not have permission.');
            res.render('admin/users/user', {
                ...res.locals.stdArgs,
                title: targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
                logoutNonce: nonce,
                activeItem: 'users',
                subtitle: targetUser.first_name + ' ' + targetUser.last_name,
                hasPermission: false,
                showBack: true,
                backUrl: '../users'
            });
        });
    });
};
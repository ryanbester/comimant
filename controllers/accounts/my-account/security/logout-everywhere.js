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

const { Nonce } = require('../../../../core/auth/nonce');
const { Util } = require('../../../../core/util');
const { Logger } = require('../../../../core/logger');
const { AccessToken } = require('../../../../core/auth/access-token');

exports.showLogoutEverywherePage = (req, res) => {
    let noncePromises = [
        Nonce.createNonce('user-logout', '/accounts/logout'),
        Nonce.createNonce('myaccount-security-logout-everywhere-all',
            '/accounts/myaccount/security/logout-everywhere/all-devices'),
        Nonce.createNonce('myaccount-security-logout-everywhere-other',
            '/accounts/myaccount/security/logout-everywhere/other-devices')
    ];

    Promise.all(noncePromises).then(nonces => {
        const [logoutNonce, allDevicesNonce, otherDevicesNonce] = nonces;

        res.render('accounts/my-account/security/logout-everywhere', {
            ...res.locals.stdArgs,
            title: 'Logout of all Devices | Security | My Account',
            logoutNonce: logoutNonce,
            activeItem: 'security',
            subtitle: 'Logout of all Devices',
            showBack: true,
            backUrl: '../security',
            allDevicesNonce: allDevicesNonce,
            otherDevicesNonce: otherDevicesNonce
        });
    });
};

const renderDonePage = (req, res, error, success, allDevices = false) => {
    Nonce.createNonce('user-logout', '/accounts/logout').then(nonce => {
        res.render('accounts/my-account/security/logout-everywhere-done', {
            ...res.locals.stdArgs,
            title: 'Logout of all Devices | Security | My Account',
            logoutNonce: nonce,
            activeItem: 'security',
            subtitle: 'Logout of all Devices',
            showBack: true,
            backUrl: '../../security',
            error: error,
            success: success,
            allDevices: allDevices
        });
    });
};

exports.performLogoutEverywhereAll = (req, res) => {
    const { nonce } = req.query;

    Nonce.verifyNonce('myaccount-security-logout-everywhere-all', nonce, Util.getFullPath(req.originalUrl)).then(_ => {
        const user = res.locals.user;

        const accessToken = new AccessToken(user.user_id);
        accessToken.deleteUserTokens(undefined).then(_ => {
            renderDonePage(req, res, undefined, 'Successfully logged you out on all your devices.', true);
        }, _ => {
            Logger.debug(
                Util.getClientIP(
                    req) + ' tried to perform account.security.logout-everywhere.all but could not delete access tokens.');
            renderDonePage(req, res, 'Cannot log you out. Please try again.');
        });
    }, _ => {
        Logger.debug(
            Util.getClientIP(
                req) + ' tried to perform account.security.logout-everywhere.all but nonce verification failed.');
        renderDonePage(req, res, 'Cannot log you out. Please try again.');
    });
};

exports.performLogoutEverywhereOther = (req, res) => {
    const { nonce } = req.query;

    Nonce.verifyNonce('myaccount-security-logout-everywhere-other', nonce, Util.getFullPath(req.originalUrl))
        .then(_ => {
            const user = res.locals.user;

            const accessToken = new AccessToken(user.user_id);
            accessToken.deleteUserTokens([req.signedCookies['AUTHTOKEN']]).then(_ => {
                renderDonePage(req, res, undefined, 'Successfully logged you out on your other devices.');
            }, _ => {
                Logger.debug(
                    Util.getClientIP(
                        req) + ' tried to perform account.security.logout-everywhere.other but could not delete access tokens.');
                renderDonePage(req, res, 'Cannot log you out. Please try again.');
            });
        }, _ => {
            Logger.debug(
                Util.getClientIP(
                    req) + ' tried to perform account.security.logout-everywhere.other but nonce verification failed.');
            renderDonePage(req, res, 'Cannot log you out. Please try again.');
        });
};
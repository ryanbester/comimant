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

const { Logger } = require('../../../../core/logger');
const { Sanitizer } = require('../../../../core/sanitizer');
const { Util } = require('../../../../core/util');
const { Nonce } = require('../../../../core/auth/nonce');
const { Auth } = require('../../../../core/auth/auth');

const renderPage = (req, res, error, success) => {
    let noncePromises = [
        Nonce.createNonce('user-logout', '/accounts/logout'),
        Nonce.createNonce('myaccount-security-change-password-form',
            '/accounts/myaccount/security/passwords/change-password')
    ];

    Promise.all(noncePromises).then(nonces => {
        const [logoutNonce, formNonce] = nonces;

        res.render('accounts/my-account/security/change-password', {
            ...res.locals.stdArgs,
            title: 'Change Password | Security | My Account',
            logoutNonce: logoutNonce,
            formNonce: formNonce,
            activeItem: 'security',
            subtitle: 'Change Password',
            showBack: true,
            backUrl: '../security/passwords',
            error: error,
            success: success
        });
    });
};

exports.showPasswordPage = (req, res) => {
    renderPage(req, res);
};

exports.savePassword = (req, res) => {
    let user = res.locals.user;
    let { currentPassword, newPassword, confirmPassword, nonce } = req.body;

    Nonce.verifyNonce('myaccount-security-change-password-form', nonce, Util.getFullPath(req.originalUrl)).then(_ => {
        currentPassword = Sanitizer.string(currentPassword);
        newPassword = Sanitizer.string(newPassword);
        confirmPassword = Sanitizer.string(confirmPassword);

        if (!currentPassword) {
            renderPage(req, res, 'Please enter your current password.');
            return;
        }

        if (!newPassword) {
            renderPage(req, res, 'Please enter your new password.');
            return;
        }

        if (!confirmPassword) {
            renderPage(req, res, 'Please confirm your new password.');
            return;
        }

        if (newPassword !== confirmPassword) {
            renderPage(req, res, 'Passwords do not match');
            return;
        }

        if (newPassword.length < 4) {
            renderPage(req, res, 'Your password must be at least 4 characters long.');
            return;
        }

        Auth.readPasswordFromDatabase(user.email_address).then(result => {
            Auth.verifyPassword(currentPassword, {
                all: result
            }).then(_ => {
                Auth.encryptPassword(newPassword).then(result => {
                    result.push(user.user_id);

                    Auth.savePasswordToDatabase({
                        all: result
                    }).then(_ => {
                        renderPage(req, res, undefined, 'Your password has been changed successfully.');
                    }, _ => {
                        Logger.debug(
                            Util.getClientIP(
                                req) + ' tried to save account.security.passwords.change-password but failed to save password to database.');
                        renderPage(req, res, 'Cannot set your new password. Your password will remain unchanged.');
                    });
                }, _ => {
                    Logger.debug(
                        Util.getClientIP(
                            req) + ' tried to save account.security.passwords.change-password but failed to encrypt new password.');
                    renderPage(req, res, 'Cannot set your new password. Your password will remain unchanged.');
                });
            }, _ => {
                Logger.debug(
                    Util.getClientIP(
                        req) + ' tried to save account.security.passwords.change-password but failed to verify current password.');
                renderPage(req, res, 'Your current password is incorrect.');
            });
        }, _ => {
            Logger.debug(
                Util.getClientIP(
                    req) + ' tried to save account.security.passwords.change-password but failed to read current password from database.');
            renderPage(req, res, 'Cannot set your new password. Your password will remain unchanged.');
        });
    }, _ => {
        Logger.debug(
            Util.getClientIP(
                req) + ' tried to save account.security.passwords.change-password but nonce verification failed.');
        renderPage(req, res, 'Cannot set your new password. Please try again.');
    });
};
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

const renderPage = (req, res, error, invalidFields, firstName, lastName, success) => {
    let noncePromises = [
        Nonce.createNonce('user-logout', '/accounts/logout'),
        Nonce.createNonce('myaccount-my-info-name-form', '/accounts/myaccount/my-info/name')
    ];

    Promise.all(noncePromises).then(nonces => {
        const [logoutNonce, formNonce] = nonces;

        res.render('accounts/my-account/my-info/name', {
            ...res.locals.stdArgs,
            title: 'Name | My Information | My Account',
            logoutNonce: logoutNonce,
            formNonce: formNonce,
            activeItem: 'my-info',
            subtitle: 'Name',
            showBack: true,
            backUrl: '../my-info',
            error: error,
            success: success,
            firstName: firstName === undefined ? res.locals.user.first_name : firstName,
            lastName: lastName === undefined ? res.locals.user.last_name : lastName,
            firstNameInvalid: invalidFields !== undefined ? invalidFields.includes('firstName') : invalidFields,
            lastNameInvalid: invalidFields !== undefined ? invalidFields.includes('lastName') : invalidFields
        });
    });
};

exports.showNamePage = (req, res) => {
    res.locals.user.hasPrivilege('account.info.change_name').then(result => {
        if (!result) {
            Logger.debug(
                Util.getClientIP(req) + ' tried to access page account.info.change_name but did not have permission.');
            res.render('error-custom', {
                title: 'Permission Denied',
                error: {
                    title: 'Permission Denied',
                    message: 'You do not have permission to change your name. Please contact your administrator.'
                }
            });
        } else {
            renderPage(req, res);
        }
    }, _ => {
        Logger.debug(
            Util.getClientIP(req) + ' tried to access page account.info.change_name but did not have permission.');
        res.render('error-custom', {
            title: 'Permission Denied',
            error: {
                title: 'Permission Denied',
                message: 'You do not have permission to change your name. Please contact your administrator.'
            }
        });
    });
};

exports.saveName = (req, res) => {
    let user = res.locals.user;
    let { firstName, lastName, nonce } = req.body;

    user.hasPrivilege('account.info.change_name').then(result => {
        if (!result) {
            Logger.debug(
                Util.getClientIP(req) + ' tried to access page account.info.change_name but did not have permission.');
            res.render('error-custom', {
                title: 'Permission Denied',
                error: {
                    title: 'Permission Denied',
                    message: 'You do not have permission to change your name. Please contact your administrator.'
                }
            });
            return;
        }

        Nonce.verifyNonce('myaccount-my-info-name-form', nonce, Util.getFullPath(req.originalUrl)).then(_ => {
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
                renderPage(req, res, invalidFields.length + ' fields are invalid', invalidFields, firstName, lastName);
                return;
            }

            user.first_name = firstName;
            user.last_name = lastName;

            user.saveUser().then(_ => {
                renderPage(req, res, undefined, undefined, firstName, lastName, 'Successfully saved your name');
            }, _ => {
                Logger.debug(
                    Util.getClientIP(req) + ' tried to save account.info.change_name but failed to save to database.');
                renderPage(req, res, 'Error saving your name. Please try again.', undefined, firstName, lastName);
            });
        }, _ => {
            Logger.debug(
                Util.getClientIP(req) + ' tried to save account.info.change_name but nonce verification failed.');
            renderPage(req, res, 'Error saving your name. Please try again.');
        });
    }, _ => {
        Logger.debug(
            Util.getClientIP(req) + ' tried to access page account.info.change_name but did not have permission.');
        res.render('error-custom', {
            title: 'Permission Denied',
            error: {
                title: 'Permission Denied',
                message: 'You do not have permission to change your name. Please contact your administrator.'
            }
        });
    });
};
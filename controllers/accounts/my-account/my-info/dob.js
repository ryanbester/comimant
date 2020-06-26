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

const renderPage = (req, res, error, invalidFields, day, month, year, success) => {
    let noncePromises = [
        Nonce.createNonce('user-logout', '/accounts/logout'),
        Nonce.createNonce('myaccount-my-info-dob-form', '/accounts/myaccount/my-info/dob')
    ];

    Promise.all(noncePromises).then(nonces => {
        const [logoutNonce, formNonce] = nonces;

        res.render('accounts/my-account/my-info/dob', {
            ...res.locals.stdArgs,
            title: 'Date of Birth | My Information | My Account',
            logoutNonce: logoutNonce,
            formNonce: formNonce,
            activeItem: 'my-info',
            subtitle: 'Date of Birth',
            showBack: true,
            backUrl: '../my-info',
            error: error,
            success: success,
            day: day === undefined ? res.locals.user.dob.getDate() : parseInt(day),
            month: month === undefined ? (res.locals.user.dob.getMonth() + 1).toString() : month,
            year: year === undefined ? res.locals.user.dob.getFullYear() : parseInt(year),
            dayInvalid: invalidFields !== undefined ? invalidFields.includes('day') : invalidFields,
            monthInvalid: invalidFields !== undefined ? invalidFields.includes('month') : invalidFields,
            yearInvalid: invalidFields !== undefined ? invalidFields.includes('year') : invalidFields
        });
    });
};

exports.showDobPage = (req, res) => {
    res.locals.user.hasPrivilege('account.info.change_dob').then(result => {
        if (!result) {
            Logger.debug(
                Util.getClientIP(
                    req) + ' tried to access page account.info.change_dob but did not have permission.');
            res.render('error-custom', {
                title: 'Permission Denied',
                error: {
                    title: 'Permission Denied',
                    message: 'You do not have permission to change your date of birth. Please contact your administrator.'
                }
            });
        } else {
            renderPage(req, res);
        }
    }, _ => {
        Logger.debug(
            Util.getClientIP(req) + ' tried to access page account.info.change_dob but did not have permission.');
        res.render('error-custom', {
            title: 'Permission Denied',
            error: {
                title: 'Permission Denied',
                message: 'You do not have permission to change your date of birth. Please contact your administrator.'
            }
        });
    });
};

exports.saveDob = (req, res) => {
    let user = res.locals.user;
    let { day, month, year, nonce } = req.body;

    user.hasPrivilege('account.info.change_dob').then(result => {
        if (!result) {
            Logger.debug(
                Util.getClientIP(
                    req) + ' tried to access page account.info.change_dob but did not have permission.');
            res.render('error-custom', {
                title: 'Permission Denied',
                error: {
                    title: 'Permission Denied',
                    message: 'You do not have permission to change your date of birth. Please contact your administrator.'
                }
            });
            return;
        }

        Nonce.verifyNonce('myaccount-my-info-dob-form', nonce, Util.getFullPath(req.originalUrl)).then(_ => {
            day = Sanitizer.number(day);
            month = Sanitizer.number(month);
            year = Sanitizer.number(year);

            if (day < 1 || day > 31) {
                day = false;
            }

            if (month < 1 || month > 12) {
                month = false;
            }

            if (year < 1) {
                year = false;
            }

            let invalidFields = [];
            if (!day) {
                invalidFields.push('day');
            }

            if (!month) {
                invalidFields.push('month');
            }

            if (!year) {
                invalidFields.push('year');
            }

            if (invalidFields.length > 0) {
                renderPage(req, res, invalidFields.length + ' fields are invalid', invalidFields, day, month, year);
                return;
            }

            user.dob = new Date(year, month - 1, day);

            user.saveUser().then(_ => {
                renderPage(req, res, undefined, undefined, day, month, year, 'Successfully saved your date of birth');
            }, _ => {
                Logger.debug(
                    Util.getClientIP(
                        req) + ' tried to save account.info.change_dob but failed to save to database.');
                renderPage(req, res, 'Error saving your date of birth. Please try again.', undefined, day, month, year);
            });
        }, _ => {
            Logger.debug(
                Util.getClientIP(req) + ' tried to save account.info.change_dob but nonce verification failed.');
            renderPage(req, res, 'Error saving your date of birth. Please try again.');
        });
    }, _ => {
        Logger.debug(
            Util.getClientIP(req) + ' tried to access page account.info.change_dob but did not have permission.');
        res.render('error-custom', {
            title: 'Permission Denied',
            error: {
                title: 'Permission Denied',
                message: 'You do not have permission to change your date of birth. Please contact your administrator.'
            }
        });
    });
};
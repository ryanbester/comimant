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

const renderPage = (req, res, error, invalidFields, day, month, year, success) => {
    let noncePromises = [
        Nonce.createNonce('user-logout', '/accounts/logout'),
        Nonce.createNonce('admin-users-user-dob-form',
            '/admin/users/' + res.locals.targetUser.user_id.toLowerCase() + '/dob')
    ];

    Promise.all(noncePromises).then(results => {
        const [logoutNonce, formNonce] = results;

        res.render('admin/users/dob', {
            ...res.locals.stdArgs,
            title: 'Date of Birth | Users | Admin',
            logoutNonce: logoutNonce,
            formNonce: formNonce,
            activeItem: 'users',
            subtitle: 'Date of Birth | ' + res.locals.targetUser.first_name + ' ' + res.locals.targetUser.last_name,
            showBack: true,
            backUrl: '../' + res.locals.targetUser.user_id.toLowerCase(),
            error: error,
            success: success,
            day: day === undefined ? res.locals.targetUser.dob.getDate() : parseInt(day),
            month: month === undefined ? (res.locals.targetUser.dob.getMonth() + 1).toString() : month,
            year: year === undefined ? res.locals.targetUser.dob.getFullYear() : parseInt(year),
            dayInvalid: invalidFields !== undefined ? invalidFields.includes('day') : invalidFields,
            monthInvalid: invalidFields !== undefined ? invalidFields.includes('month') : invalidFields,
            yearInvalid: invalidFields !== undefined ? invalidFields.includes('year') : invalidFields
        });
    });
};

exports.showDobPage = (req, res) => {
    renderPage(req, res);
};

exports.changeDob = (req, res) => {
    let targetUser = res.locals.targetUser;
    let { day, month, year, nonce } = req.body;

    Nonce.verifyNonce('admin-users-user-dob-form', nonce, Util.getFullPath(req.originalUrl)).then(_ => {
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

        targetUser.dob = new Date(year, month - 1, day);
        targetUser.saveUser().then(_ => {
            renderPage(req, res, undefined, undefined, day, month, year,
                'Successfully saved the user\'s email address');
        }, _ => {
            Logger.debug(
                Util.getClientIP(
                    req) + ' tried to access page admin.users.change_dob but failed to save to database.');
            renderPage(req, res, 'Error saving the user\'s date of birth. Please try again.');
        });
    }, _ => {
        Logger.debug(
            Util.getClientIP(req) + ' tried to access page admin.users.change_dob but nonce verification failed.');
        renderPage(req, res, 'Error saving the user\'s date of birth. Please try again.');
    });

};

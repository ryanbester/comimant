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

const renderPage = (req, res, error, invalidFields, emailAddress, success) => {
    let noncePromises = [
        Nonce.createNonce('user-logout', '/accounts/logout'),
        Nonce.createNonce('admin-users-user-email-form',
            '/admin/users/' + res.locals.targetUser.user_id.toLowerCase() + '/email-address')
    ];

    Promise.all(noncePromises).then(results => {
        const [logoutNonce, formNonce] = results;

        res.render('admin/users/email', {
            ...res.locals.stdArgs,
            title: 'Email Address | Users | Admin',
            logoutNonce: logoutNonce,
            formNonce: formNonce,
            activeItem: 'users',
            subtitle: 'Email Address | ' + res.locals.targetUser.first_name + ' ' + res.locals.targetUser.last_name,
            showBack: true,
            backUrl: '../' + res.locals.targetUser.user_id.toLowerCase(),
            error: error,
            success: success,
            email: emailAddress === undefined ? res.locals.targetUser.email_address : emailAddress,
            lastNameInvalid: invalidFields !== undefined ? invalidFields.includes('email') : false
        });
    });
};

exports.showEmailPage = (req, res) => {
    renderPage(req, res);
};

exports.changeEmailAddress = (req, res) => {
    let targetUser = res.locals.targetUser;
    let { email, nonce } = req.body;

    Nonce.verifyNonce('admin-users-user-email-form', nonce, Util.getFullPath(req.originalUrl)).then(_ => {
        email = Sanitizer.email(Sanitizer.string(email));

        let invalidFields = [];
        if (!email) {
            invalidFields.push('email');
        }

        if (invalidFields.length > 0) {
            renderPage(req, res, invalidFields.length + ' fields are invalid', invalidFields, email);
            return;
        }

        targetUser.email_address = email;
        targetUser.saveUser().then(_ => {
            renderPage(req, res, undefined, undefined, email, 'Successfully saved the user\'s email address');
        }, _ => {
            Logger.debug(
                Util.getClientIP(
                    req) + ' tried to access page admin.users.change_email but failed to save to database.');
            renderPage(req, res, 'Error saving the user\'s email address. Please try again.');
        });
    }, _ => {
        Logger.debug(
            Util.getClientIP(
                req) + ' tried to access page admin.users.change_email but nonce verification failed.');
        renderPage(req, res, 'Error saving the user\'s email address. Please try again.');
    });

};

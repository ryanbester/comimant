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

const fs = require('fs');
const { Sanitizer } = require('../../core/sanitizer');

const { Logger } = require('../../core/logger');
const { Nonce } = require('../../core/auth/nonce');
const { User } = require('../../core/auth/user');
const { Auth } = require('../../core/auth/auth');
const { Util } = require('../../core/util');

const renderPage = (req, res, error, invalidFields, email, firstName, lastName, username, dobDay,
                    dobMonth, dobYear, success) => {

    Nonce.createNonce('setup-new-user-form', '/setup/user').then(nonce => {
        res.render('setup/install-user', {
            stylesheets: [
                res.locals.protocol + res.locals.mainDomain + '/stylesheets/my-account.css'
            ],
            title: 'Setup',
            formNonce: nonce,
            activeItem: 'users',
            subtitle: 'New User',
            showBack: true,
            backUrl: '../users',
            error: error,
            success: success,
            emailAddress: email,
            firstName: firstName,
            lastName: lastName,
            username: username,
            day: parseInt(dobDay),
            month: dobMonth,
            year: parseInt(dobYear),
            emailAddressInvalid: invalidFields !== undefined ? invalidFields.includes('email') : false,
            firstNameInvalid: invalidFields !== undefined ? invalidFields.includes('firstName') : false,
            lastNameInvalid: invalidFields !== undefined ? invalidFields.includes('lastName') : false,
            usernameInvalid: invalidFields !== undefined ? invalidFields.includes('username') : false,
            dobDayInvalid: invalidFields !== undefined ? invalidFields.includes('dobDay') : false,
            dobMonthInvalid: invalidFields !== undefined ? invalidFields.includes('dobMonth') : false,
            dobYearInvalid: invalidFields !== undefined ? invalidFields.includes('dobYear') : false,
            passwordInvalid: invalidFields !== undefined ? invalidFields.includes('password') : false,
            confirmPasswordInvalid: invalidFields !== undefined ? invalidFields.includes('confirmPassword') : false
        });
    });
};

exports.showUserPage = (req, res, next) => {
    if (res.locals.setupAction === 'initial') {
        renderPage(req, res);
    } else {
        const err = new Error('404: Page not found');
        err.status = 404;
        next(err);
    }
};

exports.saveUser = (req, res, next) => {
    if (res.locals.setupAction === 'initial') {
        let { emailAddress: email, firstName, lastName, username, day: dobDay, month: dobMonth, year: dobYear, password, confirmPassword, nonce } = req.body;

        Nonce.verifyNonce('setup-new-user-form', nonce, Util.getFullPath(req.originalUrl)).then(_ => {
            email = Sanitizer.email(Sanitizer.string(email));
            firstName = Sanitizer.ascii(Sanitizer.whitespace(Sanitizer.string(firstName)));
            lastName = Sanitizer.ascii(Sanitizer.whitespace(Sanitizer.string(lastName)));
            username = Sanitizer.ascii(Sanitizer.whitespace(Sanitizer.string(username)));
            dobDay = Sanitizer.number(dobDay);
            dobMonth = Sanitizer.number(dobMonth);
            dobYear = Sanitizer.number(dobYear);
            password = Sanitizer.string(password);
            confirmPassword = Sanitizer.string(confirmPassword);

            if (dobDay < 1 || dobDay > 31) {
                dobDay = false;
            }

            if (dobMonth < 1 || dobMonth > 12) {
                dobMonth = false;
            }

            if (dobYear < 1) {
                dobYear = false;
            }

            let invalidFields = [];

            if (!email) {
                invalidFields.push('email');
            }

            if (!firstName) {
                invalidFields.push('firstName');
            }

            if (!lastName) {
                invalidFields.push('lastName');
            }

            if (!username) {
                invalidFields.push('username');
            }

            if (!dobDay) {
                invalidFields.push('dobDay');
            }

            if (!dobMonth) {
                invalidFields.push('dobMonth');
            }

            if (!dobYear) {
                invalidFields.push('dobYear');
            }

            if (!password) {
                invalidFields.push('password');
            }

            if (!confirmPassword) {
                invalidFields.push('confirmPassword');
            }

            const args = [
                email,
                firstName,
                lastName,
                username,
                dobDay,
                dobMonth,
                dobYear
            ];

            if (invalidFields.length > 0) {
                renderPage(req, res, invalidFields.length + ' fields are invalid', invalidFields, ...args);
                return;
            }

            if (password !== confirmPassword) {
                renderPage(req, res, 'Passwords do not match', undefined, ...args);
                return;
            }
            if (password.length < 4) {
                renderPage(req, res, 'Password must be at least 4 characters long', undefined, ...args);
                return;
            }

            const createUser = privileges => {
                User.generateUserId().then(user_id => {
                    let user = new User(user_id, username, email, firstName, lastName, new Date().setTimeToNow(),
                        new Date(dobYear, dobMonth - 1, dobDay));
                    user.saveUser().then(_ => {
                        Auth.encryptPassword(confirmPassword).then(result => {
                            result.push(user_id);
                            Auth.savePasswordToDatabase({ all: result }).then(_ => {
                                // Add privileges
                                let privilegePromises = [];

                                for (const privilege in privileges) {
                                    privilegePromises.push(user.addPrivilege(privilege, true));
                                }

                                // Save new package version to mark setup as complete
                                const packageVersion = res.locals.setupPackageVersion;
                                fs.writeFileSync(__approot + '/version.txt',
                                    packageVersion.major + '.' + packageVersion.minor + '.' + packageVersion.patch);

                                Promise.all(privilegePromises).then(_ => {
                                    renderPage(req, res, undefined, undefined, undefined, undefined, undefined,
                                        undefined, undefined, undefined, undefined, 'Created user');
                                }, _ => {
                                    renderPage(req, res, 'Error creating user. Please try again.', undefined,
                                        ...args);
                                });

                            }, _ => {
                                renderPage(req, res, 'Error creating user. Please try again.', undefined,
                                    ...args);
                            });
                        }, _ => {
                            renderPage(req, res, 'Error creating user. Please try again.', undefined,
                                ...args);
                        });
                    }, _ => {
                        renderPage(req, res, 'Error creating user. Please try again.', undefined, ...args);
                    });
                }, _ => {
                    renderPage(req, res, 'Error creating user. Please try again.', undefined, ...args);
                });
            };

            User.usernameTaken(username).then(result => {
                if (result === true) {
                    renderPage(req, res, '1 field is invalid', ['username'], ...args);
                } else {
                    createUser([
                        // TODO: Set default admin privileges
                        'myaccount.info.change_name',
                        'myaccount.info.change_username',
                        'myaccount.info.change_dob',
                        'admin.access_admin_panel',
                        'admin.users.list',
                        'admin.users.view',
                        'admin.users.create',
                        'admin.users.delete',
                    ]);
                }
            }, _ => {
                renderPage(req, res, '1 field is invalid', ['username'], ...args);
            });
        }, _ => {
            renderPage(req, res, 'Error creating user. Please try again.');
        });
    } else {
        const err = new Error('404: Page not found');
        err.status = 404;
        next(err);
    }
};

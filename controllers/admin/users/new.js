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

const renderPage = (req, res, hasPermission, error, invalidFields, email, firstName, lastName, username, dobDay,
                    dobMonth, dobYear, success) => {
    let noncePromises = [
        Nonce.createNonce('user-logout', '/accounts/logout'),
        Nonce.createNonce('admin-users-new-user-form', '/admin/users/new'),
        PrivilegeTemplates.getPrivilegeTemplates()
    ];

    Promise.all(noncePromises).then(results => {
        const [logoutNonce, formNonce, pt] = results;

        res.render('admin/users/new', {
            ...res.locals.stdArgs,
            title: 'New User | Users | Admin',
            logoutNonce: logoutNonce,
            formNonce: formNonce,
            activeItem: 'users',
            subtitle: 'New User',
            showBack: true,
            backUrl: '../users',
            error: error,
            success: success,
            hasPermission: hasPermission,
            pt: pt,
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

exports.showNewUserPage = (req, res) => {
    res.locals.user.hasPrivilege('admin.users.create').then(result => {
        if (result === true) {
            renderPage(req, res, true);
        } else {
            Logger.debug(
                Util.getClientIP(req) + ' tried to access page admin.users.create but did not have permission.');
            renderPage(req, res, false);
        }
    }, _ => {
        Logger.debug(
            Util.getClientIP(req) + ' tried to access page admin.users.create but did not have permission.');
        renderPage(req, res, false);
    });
};

exports.saveNewUser = (req, res) => {
    res.locals.user.hasPrivilege('admin.users.create').then(result => {
        if (!result) {
            Logger.debug(
                Util.getClientIP(req) + ' tried to access page admin.users.create but did not have permission.');
            renderPage(req, res, false);
            return;
        }

        let { pt: ptName, emailAddress: email, firstName, lastName, username, day: dobDay, month: dobMonth, year: dobYear, password, confirmPassword, nonce } = req.body;

        Nonce.verifyNonce('admin-users-new-user-form', nonce, Util.getFullPath(req.originalUrl)).then(_ => {
            ptName = Sanitizer.string(ptName);
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
            if (!ptName) {
                ptName = 'none';
            }

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
                renderPage(req, res, true, invalidFields.length + ' fields are invalid', invalidFields, ...args);
                return;
            }

            if (password !== confirmPassword) {
                renderPage(req, res, true, 'Passwords do not match', undefined, ...args);
                return;
            }
            if (password.length < 4) {
                renderPage(req, res, true, 'Password must be at least 4 characters long', undefined, ...args);
                return;
            }

            const preparePrivileges = _ => {
                User.generateUserId().then(user_id => {
                    const createNewUser = privileges => {
                        let user = new User(user_id, username, email, firstName, lastName, new Date().setTimeToNow(), new Date(dobYear, dobMonth - 1, dobDay));
                        user.saveUser().then(_ => {
                            Auth.encryptPassword(confirmPassword).then(result => {
                                result.push(user_id);
                                Auth.savePasswordToDatabase({ all: result }).then(_ => {
                                    // Add privileges
                                    let privilegePromises = [];

                                    for (const privilege in privileges) {
                                        privilegePromises.push(user.addPrivilege(privilege, (privileges[privilege] === 1)));
                                    }

                                    Promise.all(privilegePromises).then(_ => {
                                        res.redirect(301, '../users/' + user.user_id.toLowerCase());
                                    }, _ => {
                                        Logger.debug(
                                            Util.getClientIP(
                                                req) + ' tried to access page admin.users.create but failed to save a privilege to the database.');
                                        renderPage(req, res, true, 'Error creating user. Please try again.', undefined,
                                            ...args);
                                    });

                                }, _ => {
                                    Logger.debug(
                                        Util.getClientIP(
                                            req) + ' tried to access page admin.users.create but failed to save the password to the database.');
                                    renderPage(req, res, true, 'Error creating user. Please try again.', undefined,
                                        ...args);
                                });
                            }, _ => {
                                Logger.debug(
                                    Util.getClientIP(
                                        req) + ' tried to access page admin.users.create but failed to encrypt the password.');
                                renderPage(req, res, true, 'Error creating user. Please try again.', undefined,
                                    ...args);
                            });
                        }, _ => {
                            Logger.debug(
                                Util.getClientIP(
                                    req) + ' tried to access page admin.users.create but failed to save the user to the database.');
                            renderPage(req, res, true, 'Error creating user. Please try again.', undefined, ...args);
                        });
                    };

                    const pt = new PrivilegeTemplate(ptName);

                    // Check if user has selected a privilege template or is creating a user from a blank template.
                    if (ptName !== 'none') {
                        pt.loadInfo().then(_ => {
                            let privileges = {};

                            if (pt.privileges !== undefined) {
                                privileges = pt.privileges;
                            }

                            createNewUser(privileges);
                        }, _ => {
                            Logger.debug(
                                Util.getClientIP(
                                    req) + ' tried to access page admin.users.create but failed to load privilege template information from the database.');
                            renderPage(req, res, true, 'Error creating user. Please try again.', undefined, ...args);
                        });
                    } else {
                        createNewUser({});
                    }
                }, _ => {
                    Logger.debug(
                        Util.getClientIP(
                            req) + ' tried to access page admin.users.create but failed to generate a user ID.');
                    renderPage(req, res, true, 'Error creating user. Please try again.', undefined, ...args);
                });
            };

            User.usernameTaken(username).then(result => {
                if (result === true) {
                    renderPage(req, res, true, '1 field is invalid', ['username'], ...args);
                } else {
                    preparePrivileges();
                }
            }, _ => {
                renderPage(req, res, true, '1 field is invalid', ['username'], ...args);
            });
        }, _ => {
            Logger.debug(
                Util.getClientIP(req) + ' tried to access page admin.users.create but nonce verification failed.');
            renderPage(req, res, true, 'Error creating new user. Please try again.');
        });
    }, _ => {
        Logger.debug(
            Util.getClientIP(req) + ' tried to access page admin.users.create but did not have permission.');
        renderPage(req, res, false);
    });

};
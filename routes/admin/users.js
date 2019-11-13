/*
Copyright (C) 2019 Bester Intranet
*/

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const argon2 = require('argon2');
const multiparty = require('multiparty');

const Util = require('../../core/util');
const { Auth, AccessToken, User, Nonce } = require('../../core/auth');
const AuthUtil = require('../../core/auth-util')
const app = require('../../app');
const { Service, ServiceManager } = require('../../core/myaccount/servicemanager');

exports.showAdminUsersPage = (req, res, next) => {
    var noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    var usersPromise = AuthUtil.get_users();

    Promise.all([noncePromise, usersPromise]).then(results => {
        let nonce = results[0];
        let users = results[1];

        res.render('admin-users', {
            useBootstrap: false,
            scripts: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
            ],
            title: 'Users | Admin',
            logoutNonce: nonce,
            activeItem: 'users',
            subtitle: 'Users',
            users: users
        });
    });
}

exports.showAdminNewUserPage = (req, res, next) => {
    Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {    
        res.render('admin-users-new', {
            useBootstrap: false,
            scripts: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
            ],
            title: 'New User | Users | Admin',
            logoutNonce: result,
            activeItem: 'users',
            subtitle: 'New User'
        });
    });
}

exports.loadUserInfo = (req, res, next) => {
    const showError = () => {
        Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {
            res.render('admin-users-user', {
                useBootstrap: false,
                scripts: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
                ],
                title: 'Unknown User | Users | Admin',
                logoutNonce: result,
                activeItem: 'users',
                subtitle: 'Unknown User'
            });
        });
    }

    const userId = req.params.userId;
    const user = new User(userId);

    user.loadInfo().then(result => {
        res.locals.user = user;
        next();
    }, err => showError());
}

exports.showAdminUserPage = (req, res, next) => {
    const user = res.locals.user;

    const noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');

    const services = new ServiceManager(user.user_id);
    const servicesPromise = services.getServices();

    Promise.all([noncePromise, servicesPromise]).then(results => {    
        res.render('admin-users-user', {
            useBootstrap: false,
            scripts: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
            ],
            title: user.first_name + ' ' + user.last_name + ' | Users | Admin',
            logoutNonce: results[0],
            activeItem: 'users',
            subtitle: user.first_name + ' ' + user.last_name,
            adminUser: user,
            services: results[1]
        });
    });
}

exports.showAdminUsersNamePage = (req, res, next) => {
    const user = res.locals.user;

    const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const formNoncePromise = Nonce.createNonce('admin-user-name-form', '/admin/users/' + user.user_id.toLowerCase() + '/name/');

    Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
        res.render('admin-users-user-name', {
            useBootstrap: false,
            scripts: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'Change User\'s Name | ' + user.first_name + ' ' + user.last_name + ' | Users | Admin',
            logoutNonce: results[0],
            activeItem: 'users',
            subtitle: 'Name | ' + user.first_name + ' ' + user.last_name,
            firstName: user.first_name,
            lastName: user.last_name,
            formNonce: results[1]
        });
    });
}

exports.performAdminUsersSaveName = (req, res, next) => {
    let user = res.locals.user;

    let firstName = req.body.firstName;
    let lastName = req.body.lastName;

    const showError = (error, invalidFields) => {
        let firstNameInvalid = false;
        let lastNameInvalid = false;

        if(invalidFields != undefined){
            if(invalidFields.includes('firstName')){
                firstNameInvalid = true;
            }
            if(invalidFields.includes('lastName')){
                lastNameInvalid = true;
            }
        }

        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-user-name-form', '/admin/users/' + user.user_id.toLowerCase() + '/name/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-name', {
                useBootstrap: false,
                scripts: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Change User\'s Name | ' + user.first_name + ' ' + user.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Name | ' + user.first_name + ' ' + user.last_name,
                firstName: firstName,
                lastName: lastName,
                formNonce: results[1],
                firstNameInvalid: firstNameInvalid,
                lastNameInvalid: lastNameInvalid,
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-user-name-form', '/admin/users/' + user.user_id.toLowerCase() + '/name/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-name', {
                useBootstrap: false,
                scripts: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Change User\'s Name | ' + user.first_name + ' ' + user.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Name | ' + user.first_name + ' ' + user.last_name,
                firstName: firstName,
                lastName: lastName,
                formNonce: results[1],
                success: message
            });
        });
    }

    Nonce.verifyNonce('admin-user-name-form', req.body.nonce, req.path).then(result => {
        if(result == true){
            // Validate fields
            invalidFields = [];

            if(firstName.length < 1){
                invalidFields.push('firstName');
            }

            if(lastName.length < 1){
                invalidFields.push('lastName');
            }

            if(invalidFields.length > 0){
                showError(invalidFields.length + " fields are invalid", invalidFields);
            } else {
                const performSave = () => {
                    user.first_name = firstName;
                    user.last_name = lastName;

                    user.saveUser().then(result => {
                        if(result == true){
                            showSuccess("Successfully saved user details");
                        } else {
                            showError("Error saving user details. Please try again.");
                        }
                    }, err => {
                        showError("Error saving user details. Please try again.");
                    });
                }

                performSave();
            }
        } else {
            showError("Error saving user details. Please try again.");
        }
    }, err => {
        showError("Error saving user details. Please try again.");
    });
}

exports.showAdminUsersUsernamePage = (req, res, next) => {
    const user = res.locals.user;

    const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const formNoncePromise = Nonce.createNonce('admin-user-username-form', '/admin/users/' + user.user_id.toLowerCase() + '/username/');

    Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
        res.render('admin-users-user-username', {
            useBootstrap: false,
            scripts: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'Change User\'s Username | ' + user.first_name + ' ' + user.last_name + ' | Users | Admin',
            logoutNonce: results[0],
            activeItem: 'users',
            subtitle: 'Username | ' + user.first_name + ' ' + user.last_name,
            username: user.username,
            formNonce: results[1]
        });
    });
}

exports.performAdminUsersSaveUsername = (req, res, next) => {
    let user = res.locals.user;

    let username = req.body.username;

    const showError = (error, invalidFields) => {
        let usernameInvalid = false;

        if(invalidFields != undefined){
            if(invalidFields.includes('username')){
                usernameInvalid = true;
            }
        }

        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-user-username-form', '/admin/users/' + user.user_id.toLowerCase() + '/username/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-username', {
                useBootstrap: false,
                scripts: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Change User\'s Username | ' + user.first_name + ' ' + user.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Username | ' + user.first_name + ' ' + user.last_name,
                username: firstName,
                formNonce: results[1],
                usernameInvalid: firstNameInvalid,
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-user-username-form', '/admin/users/' + user.user_id.toLowerCase() + '/username/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-username', {
                useBootstrap: false,
                scripts: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Change User\'s Username | ' + user.first_name + ' ' + user.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Username | ' + user.first_name + ' ' + user.last_name,
                username: username,
                formNonce: results[1],
                success: message
            });
        });
    }

    Nonce.verifyNonce('admin-user-username-form', req.body.nonce, req.path).then(result => {
        if(result == true){
            // Validate fields
            invalidFields = [];

            if(username.length < 1){
                invalidFields.push('username');
            }

            if(invalidFields.length > 0){
                showError(invalidFields.length + " fields are invalid", invalidFields);
            } else {
                const performSave = () => {
                    user.username = username;

                    user.saveUser().then(result => {
                        if(result == true){
                            showSuccess("Successfully saved user details");
                        } else {
                            showError("Error saving user details. Please try again.");
                        }
                    }, err => {
                        showError("Error saving user details. Please try again.");
                    });
                }

                if(username != user.username){
                    User.usernameTaken(username).then(result => {
                        if(result == true){
                            showError("1 fields are invalid", ['username']);
                        } else {
                            performSave();
                        }
                    }, err => {
                        showError("1 fields are invalid", ['username']);
                    });
                } else {
                    performSave();
                }
            }
        } else {
            showError("Error saving user details. Please try again.");
        }
    }, err => {
        showError("Error saving user details. Please try again.");
    });
}

exports.showAdminUsersEmailAddressPage = (req, res, next) => {
    const user = res.locals.user;

    const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const formNoncePromise = Nonce.createNonce('admin-user-email-address-form', '/admin/users/' + user.user_id.toLowerCase() + '/email-address/');

    Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
        res.render('admin-users-user-email-address', {
            useBootstrap: false,
            scripts: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'Change User\'s Email Address | ' + user.first_name + ' ' + user.last_name + ' | Users | Admin',
            logoutNonce: results[0],
            activeItem: 'users',
            subtitle: 'Email Address | ' + user.first_name + ' ' + user.last_name,
            email: user.email_address,
            formNonce: results[1]
        });
    });
}

exports.performAdminUsersSaveEmailAddress = (req, res, next) => {
    let user = res.locals.user;

    let email = req.body.email;

    const showError = (error, invalidFields) => {
        let emailInvalid = false;

        if(invalidFields != undefined){
            if(invalidFields.includes('email')){
                emailInvalid = true;
            }
        }

        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-user-email-address-form', '/admin/users/' + user.user_id.toLowerCase() + '/email-address/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-email-address', {
                useBootstrap: false,
                scripts: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Change User\'s Email Address | ' + user.first_name + ' ' + user.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Email Address | ' + user.first_name + ' ' + user.last_name,
                email: email,
                formNonce: results[1],
                emailInvalid: emailInvalid,
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-user-email-address-form', '/admin/users/' + user.user_id.toLowerCase() + '/email-address/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-email-address', {
                useBootstrap: false,
                scripts: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Change User\'s Email Address | ' + user.first_name + ' ' + user.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Email Address | ' + user.first_name + ' ' + user.last_name,
                email: email,
                formNonce: results[1],
                success: message
            });
        });
    }

    Nonce.verifyNonce('admin-user-email-address-form', req.body.nonce, req.path).then(result => {
        if(result == true){
            // Validate fields
            invalidFields = [];

            if(email.length < 1){
                invalidFields.push('email');
            }

            if(!(function(email){
                var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                return re.test(String(email).toLowerCase());
            })(email)){
                invalidFields.push('email');
            }

            if(invalidFields.length > 0){
                showError(invalidFields.length + " fields are invalid", invalidFields);
            } else {
                const performSave = () => {
                    user.email_address = email;

                    user.saveUser().then(result => {
                        if(result == true){
                            showSuccess("Successfully saved user details");
                        } else {
                            showError("Error saving user details. Please try again.");
                        }
                    }, err => {
                        showError("Error saving user details. Please try again.");
                    });
                }

                performSave();
            }
        } else {
            showError("Error saving user details. Please try again.");
        }
    }, err => {
        showError("Error saving user details. Please try again.");
    });
}

exports.showAdminUsersDobPage = (req, res, next) => {
    const user = res.locals.user;

    const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const formNoncePromise = Nonce.createNonce('admin-user-dob-form', '/admin/users/' + user.user_id.toLowerCase() + '/dob/');

    Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
        res.render('admin-users-user-dob', {
            useBootstrap: false,
            scripts: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'Change User\'s Date of Birth | ' + user.first_name + ' ' + user.last_name + ' | Users | Admin',
            logoutNonce: results[0],
            activeItem: 'users',
            subtitle: 'Date of Birth | ' + user.first_name + ' ' + user.last_name,
            day: user.dob.getDate(),
            month: user.dob.getMonth() + 1,
            year: user.dob.getFullYear(),
            formNonce: results[1]
        });
    });
}

exports.performAdminUsersSaveDob = (req, res, next) => {
    let user = res.locals.user;

    let day = req.body.day;
    let month = req.body.month;
    let year = req.body.year;

    const showError = (error, invalidFields) => {
        let dayInvalid = false;
        let monthInvalid = false;
        let yearInvalid = false;

        if(invalidFields != undefined){
            if(invalidFields.includes('day')){
                dayInvalid = true;
            }
            if(invalidFields.includes('month')){
                monthInvalid = true;
            }
            if(invalidFields.includes('year')){
                yearInvalid = true;
            }
        }

        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-user-dob-form', '/admin/users/' + user.user_id.toLowerCase() + '/dob/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-dob', {
                useBootstrap: false,
                scripts: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Change User\'s Date of Birth | ' + user.first_name + ' ' + user.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Date of Birth | ' + user.first_name + ' ' + user.last_name,
                day: day,
                month: month,
                year: year,
                formNonce: results[1],
                dayInvalid: dayInvalid,
                monthInvalid: monthInvalid,
                yearInvalid: yearInvalid,
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-user-dob-form', '/admin/users/' + user.user_id.toLowerCase() + '/dob/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-dob', {
                useBootstrap: false,
                scripts: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Change User\'s Date of Birth | ' + user.first_name + ' ' + user.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Date of Birth | ' + user.first_name + ' ' + user.last_name,
                day: day,
                month: month,
                year: year,
                formNonce: results[1],
                success: message
            });
        });
    }

    Nonce.verifyNonce('admin-user-dob-form', req.body.nonce, req.path).then(result => {
        if(result == true){
            // Validate fields
            invalidFields = [];

            if(day.length < 1 || day.length > 31){
                invalidFields.push('day');
            }

            if(month.length < 1 || month.length > 12){
                invalidFields.push('month');
            }

            if(year.length.length < 1){
                invalidFields.push('year');
            }

            if(invalidFields.length > 0){
                showError(invalidFields.length + " fields are invalid", invalidFields);
            } else {
                const performSave = () => {
                    var date = new Date(year, month - 1, day);
                    user.dob = date;

                    user.saveUser().then(result => {
                        if(result == true){
                            showSuccess("Successfully saved user details");
                        } else {
                            showError("Error saving user details. Please try again.");
                        }
                    }, err => {
                        showError("Error saving user details. Please try again.");
                    });
                }

                performSave();
            }
        } else {
            showError("Error saving user details. Please try again.");
        }
    }, err => {
        showError("Error saving user details. Please try again.");
    });
}
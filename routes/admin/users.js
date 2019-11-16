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
const { PrivilegeTemplate, PrivilegeTemplates } = require('../../core/admin/privilege-templates');

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
    const noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const formNoncePromise = Nonce.createNonce('admin-users-new-user-form', '/admin/users/new/');
    const ptPromise = PrivilegeTemplates.getPrivilegeTemplates();

    Promise.all([noncePromise, formNoncePromise, ptPromise]).then(results => {    
        res.render('admin-users-new', {
            useBootstrap: false,
            scripts: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
            ],
            title: 'New User | Users | Admin',
            logoutNonce: results[0],
            activeItem: 'users',
            subtitle: 'New User',
            pt: results[2],
            formNonce: results[1]
        });
    });
}

exports.performAdminNewUser = (req, res, next) => {
    let ptName = req.body.pt;
    let email = req.body.emailAddress;
    let firstName = req.body.firstName;
    let lastName = req.body.lastName;
    let username = req.body.username;
    let dobDay = req.body.day;
    let dobMonth = req.body.month;
    let dobYear = req.body.year;
    let password = req.body.password;
    let confirmPassword = req.body.confirmPassword;

    const showError = (error, invalidFields) => {
        let emailInvalid = false;
        let firstNameInvalid = false;
        let lastNameInvalid = false;
        let usernameInvalid = false;
        let dobDayInvalid = false;
        let dobMonthInvalid = false;
        let dobYearInvalid = false;

        if(invalidFields != undefined){
            if(invalidFields.includes('email')){
                emailInvalid = true;
            }
            if(invalidFields.includes('firstName')){
                firstNameInvalid = true;
            }
            if(invalidFields.includes('lastName')){
                lastNameInvalid = true;
            }
            if(invalidFields.includes('username')){
                usernameInvalid = true;
            }
            if(invalidFields.includes('dobDay')){
                dobDayInvalid = true;
            }
            if(invalidFields.includes('dobMonth')){
                dobMonthInvalid = true;
            }
            if(invalidFields.includes('dobYear')){
                dobYearInvalid = true;
            }
        }

        const noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-users-new-user-form', '/admin/users/new/');
        const ptPromise = PrivilegeTemplates.getPrivilegeTemplates();
    
        Promise.all([noncePromise, formNoncePromise, ptPromise]).then(results => {    
            res.render('admin-users-new', {
                useBootstrap: false,
                scripts: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
                ],
                title: 'New User | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'New User',
                pt: results[2],
                emailAddress: email,
                firstName: firstName,
                lastName: lastName,
                username: username,
                day: dobDay,
                month: dobMonth,
                year: dobYear,
                formNonce: results[1],
                emailInvalid: emailInvalid,
                firstNameInvalid: firstNameInvalid,
                lastNameInvalid: lastNameInvalid,
                usernameInvalid: usernameInvalid,
                dobDayInvalid: dobDayInvalid,
                dobMonthInvalid: dobMonthInvalid,
                dobYearInvalid: dobYearInvalid,
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        const noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-users-new-user-form', '/admin/users/new/');
        const ptPromise = PrivilegeTemplates.getPrivilegeTemplates();
    
        Promise.all([noncePromise, formNoncePromise, ptPromise]).then(results => {    
            res.render('admin-users-new', {
                useBootstrap: false,
                scripts: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
                ],
                title: 'New User | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'New User',
                pt: results[2],
                emailAddress: email,
                firstName: firstName,
                lastName: lastName,
                username: username,
                day: dobDay,
                month: dobMonth,
                year: dobYear,
                formNonce: results[1],
                success: message
            });
        });
    }

    Nonce.verifyNonce('admin-users-new-user-form', req.body.nonce, req.path).then(result => {
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

            if(firstName.length < 1){
                invalidFields.push('firstName');
            }

            if(lastName.length < 1){
                invalidFields.push('lastName');
            }

            if(username.length < 1){
                invalidFields.push('username');
            }

            if(dobDay.length < 1 || dobDay.length > 31){
                invalidFields.push('dobDay');
            }

            if(dobMonth.length < 1 || dobMonth.length > 12){
                invalidFields.push('dobMonth');
            }

            if(dobYear.length.length < 1){
                invalidFields.push('dobYear');
            }

            if(password !== confirmPassword){
                showError("Passwords do not match");
            } else if (password < 4){
                showError("Password must be at least 4 characters long");
            } else {
                if(invalidFields.length > 0){
                    showError(invalidFields.length + " fields are invalid", invalidFields);
                } else {
                    const performSave = () => {
                        User.generateUserId().then(result => {
                            var user_id = result;

                            var pt = new PrivilegeTemplate(ptName);
                            
                            pt.loadInfo().then(result => {
                                var privileges = {};

                                if(pt.privileges != undefined){
                                    privileges = pt.privileges;
                                }

                                var user = new User(user_id, username, firstName, lastName, email, new Date(dobYear, dobMonth, dobDay), privileges)
                                user.saveUser().then(result => {
                                    if(result == true){
                                        Auth.encryptPassword(confirmPassword).then(result => {
                                            result.push(user_id);

                                            Auth.savePasswordToDatabase({all: result}).then(result =>{
                                                if(result == true){
                                                    res.redirect(301, '../' + user_id.toLowerCase() + '/');
                                                } else {
                                                    showError("Error creating user. Please try again.");
                                                }
                                            }, err => {
                                                showError("Error creating user. Please try again.");
                                            });
                                        }, err => {
                                            showError("Error creating user. Please try again.");
                                        });
                                    } else {
                                        showError("Error creating user. Please try again.");
                                    }
                                }, err => {
                                    showError("Error creating user. Please try again.");
                                });
                            });
                        }, err => {
                            showError("Error creating user. Please try again.");
                        });
                    }

                    User.usernameTaken(username).then(result => {
                        if(result == true){
                            showError("1 fields are invalid", ['username']);
                        } else {
                            performSave();
                        }
                    }, err => {
                        showError("1 fields are invalid", ['username']);
                    });
                }
            }
        } else {
            showError("Error creating user. Please try again.");
        }
    }, err => {
        showError("Error creating user. Please try again.");
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

exports.showAdminUserPrivilegesPage = (req, res, next) => {
    const user = res.locals.user;

    const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const formNoncePromise = Nonce.createNonce('admin-user-privileges-form', '/admin/users/' + user.user_id.toLowerCase() + '/security/privileges/');

    Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
        res.render('admin-users-user-privileges', {
            useBootstrap: false,
            scripts: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'Privileges | ' + user.first_name + ' ' + user.last_name + ' | Users | Admin',
            logoutNonce: results[0],
            activeItem: 'users',
            subtitle: 'Privileges | ' + user.first_name + ' ' + user.last_name,
            adminUser: user,
            formNonce: results[1]
        });
    });
}

exports.performAdminUserSavePrivileges = (req, res, next) => {
    const user = res.locals.user;

    const showError = (error) => {
        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-user-privileges-form', '/admin/users/' + user.user_id.toLowerCase() + '/security/privileges/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-privileges', {
                useBootstrap: false,
                scripts: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Privileges | ' + user.first_name + ' ' + user.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Privileges | ' + user.first_name + ' ' + user.last_name,
                adminUser: user,
                formNonce: results[1],
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-user-privileges-form', '/admin/users/' + user.user_id.toLowerCase() + '/security/privileges/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-privileges', {
                useBootstrap: false,
                scripts: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Privileges | ' + user.first_name + ' ' + user.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Privileges | ' + user.first_name + ' ' + user.last_name,
                adminUser: user,
                formNonce: results[1],
                success: message
            });
        });
    }

    Nonce.verifyNonce('admin-user-privileges-form', req.body.nonce, req.path).then(result => {
        if(result == true){
            const performSave = () => {   
                Object.keys(req.body).forEach(name => {
                    if(name !== 'nonce'){
                        if(req.body[name] == 'granted'){
                            user.addPrivilege(name);
                        } else if (req.body[name] == 'denied'){
                            user.revokePrivilege(name);
                        }
                    }
                });

                user.saveUser().then(result => {
                    if(result == true){
                        showSuccess("Successfully saved privileges");
                    } else {
                        showError("Error saving privileges. Please try again.");
                    }
                }, err => {
                    showError("Error saving privileges. Please try again.");
                });
            }

            performSave();
        } else {
            showError("Error saving privileges. Please try again.");
        }
    }, err => {
        showError("Error saving privileges. Please try again.");
    });
}

exports.showAdminUserAddPrivilegePage = (req, res, next) => {
    const user = res.locals.user;

    const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const formNoncePromise = Nonce.createNonce('admin-user-privileges-add-privilege-form', '/admin/users/' + user.user_id.toLowerCase() + '/security/privileges/add-privilege/');

    Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
        res.render('admin-users-user-privileges-add', {
            useBootstrap: false,
            scripts: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'Add Privilege | ' + user.first_name + ' ' + user.last_name + ' | Users | Admin',
            logoutNonce: results[0],
            activeItem: 'users',
            subtitle: 'Add Privilege | ' + user.first_name + ' ' + user.last_name,
            granted: 1,
            formNonce: results[1]
        });
    });
}

exports.performAdminUserAddPrivilege = (req, res, next) => {
    const user = res.locals.user;

    let name = req.body.name;
    let granted = req.body.granted == 'granted' ? 1 : 0;

    const showError = (error, invalidFields) => {
        let nameInvalid = false;

        if(invalidFields != undefined){
            if(invalidFields.includes('name')){
                nameInvalid = true;
            }
        }

        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-user-privileges-add-privilege-form', '/admin/users/' + user.user_id.toLowerCase() + '/security/privileges/add-privilege/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-privileges-add', {
                useBootstrap: false,
                scripts: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Add Privilege | ' + user.first_name + ' ' + user.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Add Privilege | ' + user.first_name + ' ' + user.last_name,
                name: name,
                granted: granted,
                formNonce: results[1],
                nameInvalid: nameInvalid,
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-user-privileges-add-privilege-form', '/admin/users/' + user.user_id.toLowerCase() + '/security/privileges/add-privilege/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-privileges-add', {
                useBootstrap: false,
                scripts: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Add Privilege | ' + user.first_name + ' ' + user.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Add Privilege | ' + user.first_name + ' ' + user.last_name,
                name: name,
                granted: granted,
                formNonce: results[1],
                success: message
            });
        });
    }

    Nonce.verifyNonce('admin-user-privileges-add-privilege-form', req.body.nonce, req.path).then(result => {
        if(result == true){
            // Validate fields
            invalidFields = [];

            if(name.length < 1){
                invalidFields.push('name');
            }

            if(invalidFields.length > 0){
                showError(invalidFields.length + " fields are invalid", invalidFields);
            } else {
                const performSave = () => {
                    user.addPrivilege(name);

                    if(granted != 1){
                        user.revokePrivilege(name);
                    }

                    user.saveUser().then(result => {
                        if(result == true){
                            res.redirect(301, '../');
                        } else {
                            showError("Error adding privilege. Please try again.");
                        }
                    }, err => {
                        showError("Error adding privilege. Please try again.");
                    });
                }

                performSave();
            }
        } else {
            showError("Error adding privilege. Please try again.");
        }
    }, err => {
        showError("Error adding privilege. Please try again.");
    });
}

exports.showAdminUserApplyPrivilegeTemplatePage = (req, res, next) => {
    const user = res.locals.user;

    const noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const formNoncePromise = Nonce.createNonce('admin-user-privileges-apply-template-form', '/admin/users/' + user.user_id.toLowerCase() + '/security/privileges/apply-template/');
    const ptPromise = PrivilegeTemplates.getPrivilegeTemplates();
    
    Promise.all([noncePromise, formNoncePromise, ptPromise]).then(results => {    
        res.render('admin-users-user-privileges-apply-template', {
            useBootstrap: false,
            scripts: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
            ],
            title: 'Apply Privilege Template | ' + user.first_name + ' ' + user.last_name + ' | Users | Admin',
            logoutNonce: results[0],
            activeItem: 'users',
            subtitle: 'Apply Privilege Template | ' + user.first_name + ' ' + user.last_name,
            pt: results[2],
            formNonce: results[1]
        });
    });
}

exports.performAdminUserApplyPrivilegeTemplate = (req, res, next) => {
    const user = res.locals.user;

    let ptName = req.body.pt;

    const showError = (error) => {
        const noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-user-privileges-apply-template-form', '/admin/users/' + user.user_id.toLowerCase() + '/security/privileges/apply-template/');
        const ptPromise = PrivilegeTemplates.getPrivilegeTemplates();
        
        Promise.all([noncePromise, formNoncePromise, ptPromise]).then(results => {    
            res.render('admin-users-user-privileges-apply-template', {
                useBootstrap: false,
                scripts: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
                ],
                title: 'Apply Privilege Template | ' + user.first_name + ' ' + user.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Apply Privilege Template | ' + user.first_name + ' ' + user.last_name,
                pt: results[2],
                formNonce: results[1],
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        const noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-user-privileges-apply-template-form', '/admin/users/' + user.user_id.toLowerCase() + '/security/privileges/apply-template/');
        const ptPromise = PrivilegeTemplates.getPrivilegeTemplates();
        
        Promise.all([noncePromise, formNoncePromise, ptPromise]).then(results => {    
            res.render('admin-users-user-privileges-apply-template', {
                useBootstrap: false,
                scripts: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
                ],
                title: 'Apply Privilege Template | ' + user.first_name + ' ' + user.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Apply Privilege Template | ' + user.first_name + ' ' + user.last_name,
                pt: results[2],
                formNonce: results[1],
                success: message
            });
        });
    }

    Nonce.verifyNonce('admin-user-privileges-apply-template-form', req.body.nonce, req.path).then(result => {
        if(result == true){
            const performSave = () => {
                const pt = new PrivilegeTemplate(ptName);

                pt.loadInfo().then(result => {
                    if(result == true){
                        user.privileges = pt.getPrivileges();

                        user.saveUser().then(result => {
                            if(result == true){
                                res.redirect(301, '../');
                            } else {
                                showError("Error applying privilege template. Please try again.");
                            }
                        }, err => {
                            showError("Error applying privilege template. Please try again.");
                        });
                    } else {
                        showError("Error applying privilege template. Please try again.");
                    }
                }, err => {
                    showError("Error applying privilege template. Please try again.");
                }); 
            }

            performSave();
        } else {
            showError("Error applying privilege template. Please try again.");
        }
    }, err => {
        showError("Error applying privilege template. Please try again.");
    });
}

exports.showAdminDeleteUserPage = (req, res, next) => {
    const user = res.locals.user;

    const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const formNoncePromise = Nonce.createNonce('admin-user-delete-form', '/admin/users/' + user.user_id.toLowerCase() + '/delete-user/');

    Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
        res.render('admin-users-user-delete', {
            useBootstrap: false,
            scripts: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'Delete User: ' + user.first_name + ' ' + user.last_name + ' | Users | Admin',
            logoutNonce: results[0],
            activeItem: 'users',
            subtitle: 'Delete User: ' + user.first_name + ' ' + user.last_name,
            targetUser: user,
            formNonce: results[1]
        });
    });
}

exports.performAdminDeleteUser = (req, res, next) => {
    let user = res.locals.user;

    const showError = (error) => {
        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-user-delete-form', '/admin/users/' + user.user_id.toLowerCase() + '/delete-user/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-delete', {
                useBootstrap: false,
                scripts: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Delete User: ' + user.first_name + ' ' + user.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Delete User: ' + user.first_name + ' ' + user.last_name,
                targetUser: user,
                formNonce: results[1],
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-user-delete-form', '/admin/users/' + user.user_id.toLowerCase() + '/delete-user/');
    
        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-delete', {
                useBootstrap: false,
                scripts: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Delete User: ' + user.first_name + ' ' + user.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Delete User: ' + user.first_name + ' ' + user.last_name,
                targetUser: user,
                formNonce: results[1],
                success: message
            });
        });
    }

    Nonce.verifyNonce('admin-user-delete-form', req.body.nonce, req.path).then(result => {
        if(result == true){
            Auth.deletePasswordFromDatabase(user.user_id).then(result => {
                if(result == true){
                    user.deleteUser().then(result => {
                        if(result == true){
                            res.redirect(301, '../../');
                        } else {
                            showError("Error deleting user. Please try again.");
                        }
                    }, err => {
                        showError("Error deleting user. Please try again.");
                    });
                } else {
                    showError("Error deleting user. Please try again.");
                }
            }, err => {
                showError("Error deleting user. Please try again.");
            });
        } else {
            showError("Error deleting user. Please try again.");
        }
    }, err => {
        showError("Error deleting user. Please try again.");
    });
}
/*
Copyright (C) 2019-2020 Bester Intranet
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
const { Widget, WidgetManager } = require('../../core/widgets');

exports.showAdminUsersPage = (req, res, next) => {
    var noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    var usersPromise = AuthUtil.get_users();

    Promise.all([noncePromise, usersPromise]).then(results => {
        let nonce = results[0];
        let users = results[1];

        res.render('admin-users', {
            useBootstrap: false,
            scriptsAfter: [
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
            scriptsAfter: [
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
                scriptsAfter: [
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
                scriptsAfter: [
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

                                var user = new User(user_id, username, firstName, lastName, email, new Date(dobYear, dobMonth - 1, dobDay), privileges)
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
                scriptsAfter: [
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
    const targetUser = new User(userId);

    targetUser.loadInfo().then(result => {
        res.locals.targetUser = targetUser;
        next();
    }, err => showError());
}

exports.showAdminUserPage = (req, res, next) => {
    const targetUser = res.locals.targetUser;

    const noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');

    const services = new ServiceManager(targetUser.user_id);
    const servicesPromise = services.getServices();

    Promise.all([noncePromise, servicesPromise]).then(results => {    
        res.render('admin-users-user', {
            useBootstrap: false,
            scriptsAfter: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
            ],
            title: targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
            logoutNonce: results[0],
            activeItem: 'users',
            subtitle: targetUser.first_name + ' ' + targetUser.last_name,
            adminUser: targetUser,
            services: results[1]
        });
    });
}

exports.showAdminUsersNamePage = (req, res, next) => {
    const targetUser = res.locals.targetUser;

    const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const formNoncePromise = Nonce.createNonce('admin-user-name-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/name/');

    Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
        res.render('admin-users-user-name', {
            useBootstrap: false,
            scriptsAfter: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'Change User\'s Name | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
            logoutNonce: results[0],
            activeItem: 'users',
            subtitle: 'Name | ' + targetUser.first_name + ' ' + targetUser.last_name,
            firstName: targetUser.first_name,
            lastName: targetUser.last_name,
            formNonce: results[1]
        });
    });
}

exports.performAdminUsersSaveName = (req, res, next) => {
    let targetUser = res.locals.targetUser;

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
        const formNoncePromise = Nonce.createNonce('admin-user-name-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/name/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-name', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Change User\'s Name | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Name | ' + targetUser.first_name + ' ' + targetUser.last_name,
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
        const formNoncePromise = Nonce.createNonce('admin-user-name-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/name/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-name', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Change User\'s Name | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Name | ' + targetUser.first_name + ' ' + targetUser.last_name,
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
                    targetUser.first_name = firstName;
                    targetUser.last_name = lastName;

                    targetUser.saveUser().then(result => {
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
    const targetUser = res.locals.targetUser;

    const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const formNoncePromise = Nonce.createNonce('admin-user-username-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/username/');

    Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
        res.render('admin-users-user-username', {
            useBootstrap: false,
            scriptsAfter: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'Change User\'s Username | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
            logoutNonce: results[0],
            activeItem: 'users',
            subtitle: 'Username | ' + targetUser.first_name + ' ' + targetUser.last_name,
            username: targetUser.username,
            formNonce: results[1]
        });
    });
}

exports.performAdminUsersSaveUsername = (req, res, next) => {
    let targetUser = res.locals.targetUser;

    let username = req.body.username;

    const showError = (error, invalidFields) => {
        let usernameInvalid = false;

        if(invalidFields != undefined){
            if(invalidFields.includes('username')){
                usernameInvalid = true;
            }
        }

        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-user-username-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/username/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-username', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Change User\'s Username | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Username | ' + targetUser.first_name + ' ' + targetUser.last_name,
                username: firstName,
                formNonce: results[1],
                usernameInvalid: firstNameInvalid,
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-user-username-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/username/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-username', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Change User\'s Username | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Username | ' + targetUser.first_name + ' ' + targetUser.last_name,
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
                    targetUser.username = username;

                    targetUser.saveUser().then(result => {
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
    const targetUser = res.locals.targetUser;

    const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const formNoncePromise = Nonce.createNonce('admin-user-email-address-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/email-address/');

    Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
        res.render('admin-users-user-email-address', {
            useBootstrap: false,
            scriptsAfter: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'Change User\'s Email Address | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
            logoutNonce: results[0],
            activeItem: 'users',
            subtitle: 'Email Address | ' + targetUser.first_name + ' ' + targetUser.last_name,
            email: targetUser.email_address,
            formNonce: results[1]
        });
    });
}

exports.performAdminUsersSaveEmailAddress = (req, res, next) => {
    let targetUser = res.locals.targetUser;

    let email = req.body.email;

    const showError = (error, invalidFields) => {
        let emailInvalid = false;

        if(invalidFields != undefined){
            if(invalidFields.includes('email')){
                emailInvalid = true;
            }
        }

        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-user-email-address-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/email-address/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-email-address', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Change User\'s Email Address | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Email Address | ' + targetUser.first_name + ' ' + targetUser.last_name,
                email: email,
                formNonce: results[1],
                emailInvalid: emailInvalid,
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-user-email-address-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/email-address/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-email-address', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Change User\'s Email Address | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Email Address | ' + targetUser.first_name + ' ' + targetUser.last_name,
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
                    targetUser.email_address = email;

                    targetUser.saveUser().then(result => {
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
    const targetUser = res.locals.targetUser;

    const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const formNoncePromise = Nonce.createNonce('admin-user-dob-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/dob/');

    Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
        res.render('admin-users-user-dob', {
            useBootstrap: false,
            scriptsAfter: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'Change User\'s Date of Birth | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
            logoutNonce: results[0],
            activeItem: 'users',
            subtitle: 'Date of Birth | ' + targetUser.first_name + ' ' + targetUser.last_name,
            day: targetUser.dob.getDate(),
            month: targetUser.dob.getMonth() + 1,
            year: targetUser.dob.getFullYear(),
            formNonce: results[1]
        });
    });
}

exports.performAdminUsersSaveDob = (req, res, next) => {
    let targetUser = res.locals.targetUser;

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
        const formNoncePromise = Nonce.createNonce('admin-user-dob-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/dob/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-dob', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Change User\'s Date of Birth | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Date of Birth | ' + targetUser.first_name + ' ' + targetUser.last_name,
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
        const formNoncePromise = Nonce.createNonce('admin-user-dob-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/dob/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-dob', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Change User\'s Date of Birth | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Date of Birth | ' + targetUser.first_name + ' ' + targetUser.last_name,
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
                    targetUser.dob = date;

                    targetUser.saveUser().then(result => {
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

exports.showAdminUserWidgetsPage = (req, res, next) => {
    const targetUser = res.locals.targetUser;

    const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');

    var widgetManager = new WidgetManager(targetUser.user_id);

    widgets = [];
    unknownWidgets = [];

    var promises = [];

    widgetManager.loadWidgets().then(_ => {
        widgetManager.getAllWidgets().then(results => {
            for(var i = 0; i < results.length; i++) {
                var widget = {};

                widget.widget = results[i];

                if(widgetManager.getWidget(results[i].widget_id)) {
                    for(var j = 0; j < widgetManager.layout.widgets.length; j++) {
                        if(widgetManager.layout.widgets[j].widget_id == results[i].widget_id) {
                            widget.position = widgetManager.layout.widgets[j].position;
                            widget.height = widgetManager.layout.widgets[j].height;

                            break;
                        }
                    }
                }

                var loadInfoPromise = widget.widget.loadInfo();
                promises.push(loadInfoPromise);

                widgets.push(widget);
            }

            Promise.all(promises).then(_ => {
                Promise.all([logoutNoncePromise]).then(results => {
                    res.render('admin-users-user-widgets', {
                        useBootstrap: false,
                        scriptsAfter: [
                            'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                        ],
                        title: 'Widgets | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
                        logoutNonce: results[0],
                        activeItem: 'users',
                        subtitle: 'Widgets | ' + targetUser.first_name + ' ' + targetUser.last_name,
                        adminUser: targetUser,
                        widgets: widgets
                    });
                });
            });
        });
    }, err => {
        Promise.all([logoutNoncePromise]).then(results => {
            res.render('admin-users-user-widgets', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Widgets | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Widgets | ' + targetUser.first_name + ' ' + targetUser.last_name,
                adminUser: targetUser,
                widgets: undefined
            });
        });
    });
}

exports.showAdminUserAddWidgetPage = (req, res, next) => {
    const targetUser = res.locals.targetUser;

    const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const formNoncePromise = Nonce.createNonce('admin-user-widgets-add-widget-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/widgets/add-widget/');

    Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
        res.render('admin-users-user-widgets-add', {
            useBootstrap: false,
            scriptsAfter: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'Add Widget | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
            logoutNonce: results[0],
            activeItem: 'users',
            subtitle: 'Add Widget | ' + targetUser.first_name + ' ' + targetUser.last_name,
            formNonce: results[1]
        });
    });
}

exports.performAdminUserAddWidget = (req, res, next) => {
    const targetUser = res.locals.targetUser;

    let title = req.body.title;
    let type = req.body.type;
    let data = req.body.data;
    let position = req.body.position;
    let height = req.body.height;

    const showError = (error, invalidFields) => {
        let titleInvalid = false;
        let typeInvalid = false;
        let dataInvalid = false;
        let positionInvalid = false;
        let heightInvalid = false;

        if(invalidFields != undefined) {
            if(invalidFields.includes('title')) {
                titleInvalid = true;
            }
            if(invalidFields.includes('type')) {
                typeInvalid = true;
            }
            if(invalidFields.includes('data')) {
                dataInvalid = true;
            }
            if(invalidFields.includes('position')) {
                positionInvalid = true;
            }
            if(invalidFields.includes('height')) {
                heightInvalid = true;
            }
        }

        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-user-widgets-add-widget-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/widgets/add-widget/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-widgets-add', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Add Widget | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Add Widget | ' + targetUser.first_name + ' ' + targetUser.last_name,
                widgetTitle: title,
                type: type,
                data: data,
                position: position,
                height: height,
                formNonce: results[1],
                titleInvalid: titleInvalid,
                typeInvalid: typeInvalid,
                dataInvalid: dataInvalid,
                positionInvalid: positionInvalid,
                heightInvalid: heightInvalid,
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-user-widgets-add-widget-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/widgets/add-widget/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-widgets-add', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Add Widget | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Add Widget | ' + targetUser.first_name + ' ' + targetUser.last_name,
                widgetTitle: title,
                type: type,
                data: data,
                position: position,
                height: height,
                formNonce: results[1],
                success: message,
            });
        });
    }

    Nonce.verifyNonce('admin-user-widgets-add-widget-form', req.body.nonce, req.path).then(result => {
        if(result == true) {
            invalidFields = [];

            if(title.length < 1) {
                invalidFields.push('title');
            }

            if(type.length < 1) {
                invalidFields.push('type');
            }

            if(invalidFields.length > 0) {
                showError(invalidFields.length + " fields are invalid", invalidFields);
            } else {
                const performSave = () => {
                    Widget.generateWidgetId().then(id => {
                        var widget = new Widget(id.toUpperCase(), targetUser.user_id, type, title, data);

                        widget.saveWidget().then(result => {
                            if(result == true) {
                                var widgetManager = new WidgetManager(targetUser.user_id);

                                widgetManager.loadWidgets().then(result => {
                                    if(result == true) {
                                        if(!widgetManager.prepareUser()) {
                                            showError("Error adding widget. Please try again.");
                                        }

                                        widgetManager.addWidget(widget, parseInt(height), parseInt(position));

                                        widgetManager.saveLayout().then(result => {
                                            if(result == true) {
                                                res.redirect(301, '../');
                                            } else {
                                                showError("Error adding widget. Please try again.");
                                            }
                                        }, err => {
                                            showError("Error adding widget. Please try again.");
                                        });
                                    } else {
                                        showError("Error adding widget. Please try again.");
                                    }
                                }, err => {
                                    if(widgetManager.prepareUser()) {
                                        widgetManager.saveLayout().then(result => {
                                            if(result == true) {
                                                widgetManager.addWidget(widget, parseInt(height), parseInt(position));

                                                widgetManager.saveLayout().then(result => {
                                                    if(result == true) {
                                                        res.redirect(301, '../');
                                                    } else {
                                                        showError("Error adding widget. Please try again.");
                                                    }
                                                }, err => {
                                                    showError("Error adding widget. Please try again.");
                                                });
                                            } else {
                                                showError("Error adding widget. Please try again.");
                                            }
                                        }, err => {
                                            showError("Error adding widget. Please try again.");
                                        });
                                    } else {
                                        showError("Error adding widget. Please try again.");
                                    }
                                });
                            } else {
                                showError("Error adding widget. Please try again.");
                            }
                        }, err => {
                            showError("Error adding widget. Please try again.");
                        });
                    }, err => {
                        showError("Error adding widget. Please try again.");
                    });
                }

                performSave();
            }
        } else {
            showError("Error adding widget. Please try again.");
        }
    }, err => {
        showError("Error adding widget. Please try again.");
    });
}

exports.loadUserWidgetInfo = (req, res, next) => {
    const targetUser = res.locals.targetUser;

    const showError = () => {
        Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {
            res.render('admin-users-user-widgets-widget', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
                ],
                title: 'Unknown Widget | ' + targetUser.first_name + ' ' + targetUser.last_name,
                logoutNonce: result,
                activeItem: 'users',
                subtitle: 'Unknown Widget'
            });
        });
    }

    const widgetId = req.params.widgetId;
    const targetWidget = new Widget(widgetId, targetUser.user_id);

    targetWidget.loadInfo().then(result => {
        res.locals.targetWidget = targetWidget;
        next();
    }, err => showError());
}

exports.showAdminUserWidgetPage = (req, res, next) => {
    const targetUser = res.locals.targetUser;
    const targetWidget = res.locals.targetWidget;

    const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');

    const showError = () => {
        Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {
            res.render('admin-users-user-widgets-widget', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
                ],
                title: 'Error | ' + targetUser.first_name + ' ' + targetUser.last_name,
                logoutNonce: result,
                activeItem: 'users',
                subtitle: 'Error loading widget information'
            });
        });
    }

    Promise.all([logoutNoncePromise]).then(nonce => {
        var widgetManager = new WidgetManager(targetUser.user_id);

        widgetManager.loadWidgets().then(_ => {
            var found = false;
            for(var j = 0; j < widgetManager.layout.widgets.length; j++) {
                if(found) {
                    break;
                }

                if(widgetManager.layout.widgets[j].widget_id == targetWidget.widget_id.toUpperCase()) {
                    var data = {
                        widget: targetWidget,
                        position: widgetManager.layout.widgets[j].position,
                        height: widgetManager.layout.widgets[j].height
                    };

                    res.render('admin-users-user-widgets-widget', {
                        useBootstrap: false,
                        scriptsAfter: [
                            'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                        ],
                        title: 'Widget | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
                        logoutNonce: nonce,
                        activeItem: 'users',
                        subtitle: 'Widget | ' + targetUser.first_name + ' ' + targetUser.last_name,
                        widget: data
                    });

                    found = true;

                    break;
                }
            }

            if(!found) {
                var data = {
                    widget: targetWidget,
                    position: "",
                    height: ""
                };

                res.render('admin-users-user-widgets-widget', {
                    useBootstrap: false,
                    scriptsAfter: [
                        'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                    ],
                    title: 'Widget | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
                    logoutNonce: nonce,
                    activeItem: 'users',
                    subtitle: 'Widget | ' + targetUser.first_name + ' ' + targetUser.last_name,
                    widget: data
                });
            }
        }, err => {
            showError();
        });
    });
}

exports.showAdminUserDeleteWidgetPage = (req, res, next) => {
    const targetUser = res.locals.targetUser;
    const targetWidget = res.locals.targetWidget;

    const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const formNoncePromise = Nonce.createNonce('admin-widget-delete-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/widgets/' + targetWidget.widget_id.toLowerCase() + '/delete-widget/');

    Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
        res.render('admin-users-user-widget-delete', {
            useBootstrap: false,
            scriptsAfter: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'Delete Widget | Users | Admin',
            logoutNonce: results[0],
            activeItem: 'users',
            subtitle: 'Delete Widget',
            targetUser: targetUser,
            targetWidget: targetWidget,
            formNonce: results[1]
        });
    });
}

exports.performAdminUserDeleteWidget = (req, res, next) => {
    let targetUser = res.locals.targetUser;
    let targetWidget = res.locals.targetWidget;

    const showError = (error) => {
        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-widget-delete-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/widgets/' + targetWidget.widget_id.toLowerCase() + '/delete-widget/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-widget-delete', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Delete Widget | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Delete Widget',
                targetUser: targetUser,
                targetWidget: targetWidget,
                formNonce: results[1],
                error: error
            });
        });
    }

    Nonce.verifyNonce('admin-widget-delete-form', req.body.nonce, req.path).then(result => {
        if(result == true) {
            targetWidget.deleteWidget().then(result => {
                if(result == true) {
                    var widgetManager = new WidgetManager(targetUser.user_id);

                    widgetManager.loadWidgets().then(result => {
                        if(result == true) {
                            widgetManager.deleteWidget(targetWidget.widget_id.toUpperCase());

                            widgetManager.saveLayout().then(result => {
                                if(result == true) {
                                    res.redirect(301, '../../');
                                } else {
                                    showError("Error deleting widget. Please try again.");
                                }
                            }, err => {
                                showError("Error deleting widget. Please try again.");
                            });
                        } else {
                            showError("Error deleting widget. Please try again.");
                        }
                    }, err => {
                        showError("Error deleting widget. Please try again.");
                    });
                } else {
                    showError("Error deleting widget. Please try again.");
                }
            }, err => {
                showError("Error deleting widget. Please try again.");
            });
        } else {
            showError("Error deleting widget. Please try again.");
        }
    }, err => {
        showError("Error deleting widget. Please try again.");
    });
}

exports.showAdminUserWidgetTitlePage = (req, res, next) => {
    let targetUser = res.locals.targetUser;
    let targetWidget = res.locals.targetWidget;

    const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const formNoncePromise = Nonce.createNonce('admin-widget-title-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/widgets/' + targetWidget.widget_id.toLowerCase() + '/title/');

    Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
        res.render('admin-users-user-widget-title', {
            useBootstrap: false,
            scriptsAfter: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'Title | Users | Admin',
            logoutNonce: results[0],
            activeItem: 'users',
            subtitle: 'Title',
            targetUser: targetUser,
            targetWidget: targetWidget,
            widgetTitle: targetWidget.title,
            formNonce: results[1]
        });
    });
}

exports.performAdminUserWidgetSaveTitle = (req, res, next) => {
    let targetUser = res.locals.targetUser;
    let targetWidget = res.locals.targetWidget;

    let title = req.body.title;

    const showError = (error, invalidFields) => {
        let titleInvalid = false;

        if(invalidFields != undefined) {
            if(invalidFields.includes('title')) {
                titleInvalid = true;
            }
        }

        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-widget-title-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/widgets/' + targetWidget.widget_id.toLowerCase() + '/title/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-widget-title', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Title | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Title',
                targetUser: targetUser,
                targetWidget: targetWidget,
                widgetTitle: title,
                formNonce: results[1],
                titleInvalid: titleInvalid,
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-widget-title-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/widgets/' + targetWidget.widget_id.toLowerCase() + '/title/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-widget-title', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Title | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Title',
                targetUser: targetUser,
                targetWidget: targetWidget,
                widgetTitle: title,
                formNonce: results[1],
                success: message
            });
        });
    }

    Nonce.verifyNonce('admin-widget-title-form', req.body.nonce, req.path).then(result => {
        if(result == true) {
            invalidFields = [];

            if(title.length < 0) {
                invalidFields.push('title');
            }

            if(invalidFields.length > 0) {
                showError(invalidFields.length + " fields are invalid", invalidFields);
            } else {
                const performSave = () => {
                    targetWidget.title = title;

                    targetWidget.saveWidget().then(result => {
                        if(result == true) {
                            showSuccess("Successfully changed widget title");
                        } else {
                            showError("Error changing widget title. Please try again.");
                        }
                    }, err => {
                        showError("Error changing widget title. Please try again.");
                    });
                }

                performSave();
            }
        } else {
            showError("Error changing widget title. Please try again.");
        }
    }, err => {
        showError("Error changing widget title. Please try again.");
    });
}

exports.showAdminUserWidgetTypePage = (req, res, next) => {
    let targetUser = res.locals.targetUser;
    let targetWidget = res.locals.targetWidget;

    const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const formNoncePromise = Nonce.createNonce('admin-widget-type-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/widgets/' + targetWidget.widget_id.toLowerCase() + '/type/');

    Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
        res.render('admin-users-user-widget-type', {
            useBootstrap: false,
            scriptsAfter: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'Type | Users | Admin',
            logoutNonce: results[0],
            activeItem: 'users',
            subtitle: 'Type',
            targetUser: targetUser,
            targetWidget: targetWidget,
            type: targetWidget.type,
            formNonce: results[1]
        });
    });
}

exports.performAdminUserWidgetSaveType = (req, res, next) => {
    let targetUser = res.locals.targetUser;
    let targetWidget = res.locals.targetWidget;

    let type = req.body.type;

    const showError = (error, invalidFields) => {
        let typeInvalid = false;

        if(invalidFields != undefined) {
            if(invalidFields.includes('type')) {
                typeInvalid = true;
            }
        }

        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-widget-type-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/widgets/' + targetWidget.widget_id.toLowerCase() + '/type/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-widget-type', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Type | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Type',
                targetUser: targetUser,
                targetWidget: targetWidget,
                type: type,
                formNonce: results[1],
                typeInvalid: typeInvalid,
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-widget-type-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/widgets/' + targetWidget.widget_id.toLowerCase() + '/type/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-widget-type', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Type | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Type',
                targetUser: targetUser,
                targetWidget: targetWidget,
                type: type,
                formNonce: results[1],
                success: message
            });
        });
    }

    Nonce.verifyNonce('admin-widget-type-form', req.body.nonce, req.path).then(result => {
        if(result == true) {
            invalidFields = [];

            if(type.length < 0) {
                invalidFields.push('type');
            }

            if(invalidFields.length > 0) {
                showError(invalidFields.length + " fields are invalid", invalidFields);
            } else {
                const performSave = () => {
                    targetWidget.type = type;

                    targetWidget.saveWidget().then(result => {
                        if(result == true) {
                            showSuccess("Successfully changed widget type");
                        } else {
                            showError("Error changing widget type. Please try again.");
                        }
                    }, err => {
                        showError("Error changing widget type. Please try again.");
                    });
                }

                performSave();
            }
        } else {
            showError("Error changing widget type. Please try again.");
        }
    }, err => {
        showError("Error changing widget type. Please try again.");
    });
}

exports.showAdminUserWidgetDataPage = (req, res, next) => {
    let targetUser = res.locals.targetUser;
    let targetWidget = res.locals.targetWidget;

    const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const formNoncePromise = Nonce.createNonce('admin-widget-data-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/widgets/' + targetWidget.widget_id.toLowerCase() + '/data/');

    Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
        res.render('admin-users-user-widget-data', {
            useBootstrap: false,
            scriptsAfter: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'Data (JSON) | Users | Admin',
            logoutNonce: results[0],
            activeItem: 'users',
            subtitle: 'Data (JSON)',
            targetUser: targetUser,
            targetWidget: targetWidget,
            data: JSON.stringify(targetWidget.data),
            formNonce: results[1]
        });
    });
}

exports.performAdminUserWidgetSaveData = (req, res, next) => {
    let targetUser = res.locals.targetUser;
    let targetWidget = res.locals.targetWidget;

    let data = req.body.data;

    const showError = (error, invalidFields) => {
        let dataInvalid = false;

        if(invalidFields != undefined) {
            if(invalidFields.includes('data')) {
                dataInvalid = true;
            }
        }

        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-widget-data-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/widgets/' + targetWidget.widget_id.toLowerCase() + '/data/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-widget-data', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Data (JSON) | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Data (JSON)',
                targetUser: targetUser,
                targetWidget: targetWidget,
                data: JSON.stringify(data),
                formNonce: results[1],
                dataInvalid: dataInvalid,
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-widget-data-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/widgets/' + targetWidget.widget_id.toLowerCase() + '/data/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-widget-data', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Data (JSON) | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Data (JSON)',
                targetUser: targetUser,
                targetWidget: targetWidget,
                data: JSON.stringify(data),
                formNonce: results[1],
                success: message
            });
        });
    }

    Nonce.verifyNonce('admin-widget-data-form', req.body.nonce, req.path).then(result => {
        if(result == true) {
            invalidFields = [];

            try {
                var json = JSON.parse(data);
            } catch (e) {
                invalidFields.push('data');
            }

            if(invalidFields.length > 0) {
                showError(invalidFields.length + " fields are invalid", invalidFields);
            } else {
                const performSave = () => {
                    targetWidget.data = json;

                    targetWidget.saveWidget().then(result => {
                        if(result == true) {
                            showSuccess("Successfully saving widget data");
                        } else {
                            showError("Error saving widget data. Please try again.");
                        }
                    }, err => {
                        showError("Error saving widget data. Please try again.");
                    });
                }

                performSave();
            }
        } else {
            showError("Error saving widget data. Please try again.");
        }
    }, err => {
        showError("Error saving widget data. Please try again.");
    });
}

exports.showAdminUserWidgetPositionPage = (req, res, next) => {
    let targetUser = res.locals.targetUser;
    let targetWidget = res.locals.targetWidget;

    const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const formNoncePromise = Nonce.createNonce('admin-widget-position-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/widgets/' + targetWidget.widget_id.toLowerCase() + '/position/');

    const showError = () => {
        Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {
            res.render('admin-users-user-widget-position', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
                ],
                title: 'Error | ' + targetUser.first_name + ' ' + targetUser.last_name,
                logoutNonce: result,
                activeItem: 'users',
                subtitle: 'Error loading widget information'
            });
        });
    }

    Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
        var widgetManager = new WidgetManager(targetUser.user_id);

        widgetManager.loadWidgets().then(_ => {
            var found = false;
            for(var j = 0; j < widgetManager.layout.widgets.length; j++) {
                if(found) {
                    break;
                }

                if(widgetManager.layout.widgets[j].widget_id == targetWidget.widget_id.toUpperCase()) {
                    res.render('admin-users-user-widget-position', {
                        useBootstrap: false,
                        scriptsAfter: [
                            'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                        ],
                        title: 'Position | Users | Admin',
                        logoutNonce: results[0],
                        activeItem: 'users',
                        subtitle: 'Position',
                        targetUser: targetUser,
                        targetWidget: targetWidget,
                        position: widgetManager.layout.widgets[j].position,
                        formNonce: results[1]
                    });

                    found = true;

                    break;
                }
            }

            if(!found) {
                res.render('admin-users-user-widget-position', {
                    useBootstrap: false,
                    scriptsAfter: [
                        'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                    ],
                    title: 'Position | Users | Admin',
                    logoutNonce: results[0],
                    activeItem: 'users',
                    subtitle: 'Position',
                    targetUser: targetUser,
                    targetWidget: targetWidget,
                    position: "",
                    formNonce: results[1]
                });
            }
        }, err => {
            showError();
        });
    });
}

exports.performAdminUserWidgetSavePosition = (req, res, next) => {
    let targetUser = res.locals.targetUser;
    let targetWidget = res.locals.targetWidget;

    let position = req.body.position;

    const showError = (error, invalidFields) => {
        let positionInvalid = false;

        if(invalidFields != undefined) {
            if(invalidFields.includes('position')) {
                positionInvalid = true;
            }
        }

        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-widget-position-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/widgets/' + targetWidget.widget_id.toLowerCase() + '/position/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-widget-position', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Position | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Position',
                targetUser: targetUser,
                targetWidget: targetWidget,
                position: position,
                formNonce: results[1],
                positionInvalid: positionInvalid,
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-widget-position-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/widgets/' + targetWidget.widget_id.toLowerCase() + '/position/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-widget-position', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Position | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Position',
                targetUser: targetUser,
                targetWidget: targetWidget,
                position: position,
                formNonce: results[1],
                success: message
            });
        });
    }

    Nonce.verifyNonce('admin-widget-position-form', req.body.nonce, req.path).then(result => {
        if(result == true) {
            invalidFields = [];

            if(invalidFields.length > 0) {
                showError(invalidFields.length + " fields are invalid", invalidFields);
            } else {
                const performSave = () => {
                    var widgetManager = new WidgetManager(targetUser.user_id);

                    widgetManager.loadWidgets().then(result => {
                        if(result == true) {
                            if(widgetManager.updateWidget(targetWidget.widget_id.toUpperCase(), parseInt(position))) {
                                widgetManager.saveLayout().then(result => {
                                    if (result == true) {
                                        showSuccess("Successfully saved widget position");
                                    } else {
                                        showError("Error saving widget position. Please try again.");
                                    }
                                }, err => {
                                    showError("Error saving widget position. Please try again.");
                                });
                            } else {
                                showError("Error saving widget position. Please try again.");
                            }
                        } else {
                            showError("Error saving widget position. Please try again.");
                        }
                    }, err => {
                        showError("Error saving widget position. Please try again.");
                    });
                }

                performSave();
            }
        } else {
            showError("Error saving widget position. Please try again.");
        }
    }, err => {
        showError("Error saving widget position. Please try again.");
    });
}

exports.showAdminUserWidgetHeightPage = (req, res, next) => {
    let targetUser = res.locals.targetUser;
    let targetWidget = res.locals.targetWidget;

    const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const formNoncePromise = Nonce.createNonce('admin-widget-height-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/widgets/' + targetWidget.widget_id.toLowerCase() + '/height/');

    const showError = () => {
        Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {
            res.render('admin-users-user-widget-height', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
                ],
                title: 'Error | ' + targetUser.first_name + ' ' + targetUser.last_name,
                logoutNonce: result,
                activeItem: 'users',
                subtitle: 'Error loading widget information'
            });
        });
    }

    Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
        var widgetManager = new WidgetManager(targetUser.user_id);

        widgetManager.loadWidgets().then(_ => {
            var found = false;
            for(var j = 0; j < widgetManager.layout.widgets.length; j++) {
                if(found) {
                    break;
                }

                if(widgetManager.layout.widgets[j].widget_id == targetWidget.widget_id.toUpperCase()) {
                    res.render('admin-users-user-widget-height', {
                        useBootstrap: false,
                        scriptsAfter: [
                            'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                        ],
                        title: 'Height | Users | Admin',
                        logoutNonce: results[0],
                        activeItem: 'users',
                        subtitle: 'Height',
                        targetUser: targetUser,
                        targetWidget: targetWidget,
                        height: widgetManager.layout.widgets[j].height,
                        formNonce: results[1]
                    });

                    found = true;

                    break;
                }
            }

            if(!found) {
                res.render('admin-users-user-widget-height', {
                    useBootstrap: false,
                    scriptsAfter: [
                        'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                    ],
                    title: 'Height | Users | Admin',
                    logoutNonce: results[0],
                    activeItem: 'users',
                    subtitle: 'Height',
                    targetUser: targetUser,
                    targetWidget: targetWidget,
                    height: "",
                    formNonce: results[1]
                });
            }
        }, err => {
            showError();
        });
    });
}

exports.performAdminUserWidgetSaveHeight = (req, res, next) => {
    let targetUser = res.locals.targetUser;
    let targetWidget = res.locals.targetWidget;

    let height = req.body.height;

    const showError = (error, invalidFields) => {
        let heightInvalid = false;

        if(invalidFields != undefined) {
            if(invalidFields.includes('height')) {
                heightInvalid = true;
            }
        }

        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-widget-height-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/widgets/' + targetWidget.widget_id.toLowerCase() + '/height/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-widget-height', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Height | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Height',
                targetUser: targetUser,
                targetWidget: targetWidget,
                height: height,
                formNonce: results[1],
                heightInvalid: heightInvalid,
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-widget-height-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/widgets/' + targetWidget.widget_id.toLowerCase() + '/height/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-widget-height', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Height | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Height',
                targetUser: targetUser,
                targetWidget: targetWidget,
                height: height,
                formNonce: results[1],
                success: message
            });
        });
    }

    Nonce.verifyNonce('admin-widget-height-form', req.body.nonce, req.path).then(result => {
        if(result == true) {
            invalidFields = [];

            if(invalidFields.length > 0) {
                showError(invalidFields.length + " fields are invalid", invalidFields);
            } else {
                const performSave = () => {
                    var widgetManager = new WidgetManager(targetUser.user_id);

                    widgetManager.loadWidgets().then(result => {
                        if(result == true) {
                            if(widgetManager.updateWidget(targetWidget.widget_id.toUpperCase(), undefined, parseInt(height))) {
                                widgetManager.saveLayout().then(result => {
                                    if (result == true) {
                                        showSuccess("Successfully saved widget height");
                                    } else {
                                        showError("Error saving widget height. Please try again.");
                                    }
                                }, err => {
                                    showError("Error saving widget height. Please try again.");
                                });
                            } else {
                                showError("Error saving widget height. Please try again.");
                            }
                        } else {
                            showError("Error saving widget height. Please try again.");
                        }
                    }, err => {
                        showError("Error saving widget height. Please try again.");
                    });
                }

                performSave();
            }
        } else {
            showError("Error saving widget height. Please try again.");
        }
    }, err => {
        showError("Error saving widget height. Please try again.");
    });
}

exports.showAdminUserPrivilegesPage = (req, res, next) => {
    const targetUser = res.locals.targetUser;

    const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const formNoncePromise = Nonce.createNonce('admin-user-privileges-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/security/privileges/');

    Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
        res.render('admin-users-user-privileges', {
            useBootstrap: false,
            scriptsAfter: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'Privileges | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
            logoutNonce: results[0],
            activeItem: 'users',
            subtitle: 'Privileges | ' + targetUser.first_name + ' ' + targetUser.last_name,
            adminUser: targetUser,
            formNonce: results[1]
        });
    });
}

exports.performAdminUserSavePrivileges = (req, res, next) => {
    const targetUser = res.locals.targetUser;

    const showError = (error) => {
        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-user-privileges-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/security/privileges/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-privileges', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Privileges | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Privileges | ' + targetUser.first_name + ' ' + targetUser.last_name,
                adminUser: targetUser,
                formNonce: results[1],
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-user-privileges-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/security/privileges/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-privileges', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Privileges | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Privileges | ' + targetUser.first_name + ' ' + user.last_name,
                adminUser: targetUser,
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
                            targetUser.addPrivilege(name);
                        } else if (req.body[name] == 'denied'){
                            targetUser.revokePrivilege(name);
                        }
                    }
                });

                targetUser.saveUser().then(result => {
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
    const targetUser = res.locals.targetUser;

    const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const formNoncePromise = Nonce.createNonce('admin-user-privileges-add-privilege-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/security/privileges/add-privilege/');

    Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
        res.render('admin-users-user-privileges-add', {
            useBootstrap: false,
            scriptsAfter: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'Add Privilege | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
            logoutNonce: results[0],
            activeItem: 'users',
            subtitle: 'Add Privilege | ' + targetUser.first_name + ' ' + targetUser.last_name,
            granted: 1,
            formNonce: results[1]
        });
    });
}

exports.performAdminUserAddPrivilege = (req, res, next) => {
    const targetUser = res.locals.targetUser;

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
        const formNoncePromise = Nonce.createNonce('admin-user-privileges-add-privilege-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/security/privileges/add-privilege/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-privileges-add', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Add Privilege | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Add Privilege | ' + user.first_name + ' ' + targetUser.last_name,
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
        const formNoncePromise = Nonce.createNonce('admin-user-privileges-add-privilege-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/security/privileges/add-privilege/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-privileges-add', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Add Privilege | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Add Privilege | ' + targetUser.first_name + ' ' + targetUser.last_name,
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
                    targetUser.addPrivilege(name);

                    if(granted != 1){
                        targetUser.revokePrivilege(name);
                    }

                    targetUser.saveUser().then(result => {
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
    const targetUser = res.locals.targetUser;

    const noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const formNoncePromise = Nonce.createNonce('admin-user-privileges-apply-template-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/security/privileges/apply-template/');
    const ptPromise = PrivilegeTemplates.getPrivilegeTemplates();
    
    Promise.all([noncePromise, formNoncePromise, ptPromise]).then(results => {    
        res.render('admin-users-user-privileges-apply-template', {
            useBootstrap: false,
            scriptsAfter: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
            ],
            title: 'Apply Privilege Template | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
            logoutNonce: results[0],
            activeItem: 'users',
            subtitle: 'Apply Privilege Template | ' + targetUser.first_name + ' ' + targetUser.last_name,
            pt: results[2],
            formNonce: results[1]
        });
    });
}

exports.performAdminUserApplyPrivilegeTemplate = (req, res, next) => {
    const targetUser = res.locals.targetUser;

    let ptName = req.body.pt;

    const showError = (error) => {
        const noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-user-privileges-apply-template-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/security/privileges/apply-template/');
        const ptPromise = PrivilegeTemplates.getPrivilegeTemplates();
        
        Promise.all([noncePromise, formNoncePromise, ptPromise]).then(results => {    
            res.render('admin-users-user-privileges-apply-template', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
                ],
                title: 'Apply Privilege Template | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Apply Privilege Template | ' + targetUser.first_name + ' ' + targetUser.last_name,
                pt: results[2],
                formNonce: results[1],
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        const noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-user-privileges-apply-template-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/security/privileges/apply-template/');
        const ptPromise = PrivilegeTemplates.getPrivilegeTemplates();
        
        Promise.all([noncePromise, formNoncePromise, ptPromise]).then(results => {    
            res.render('admin-users-user-privileges-apply-template', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
                ],
                title: 'Apply Privilege Template | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Apply Privilege Template | ' + targetUser.first_name + ' ' + targetUser.last_name,
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
                        targetUser.privileges = pt.getPrivileges();

                        targetUser.saveUser().then(result => {
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
    const targetUser = res.locals.targetUser;

    const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const formNoncePromise = Nonce.createNonce('admin-user-delete-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/delete-user/');

    Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
        res.render('admin-users-user-delete', {
            useBootstrap: false,
            scriptsAfter: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'Delete User: ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
            logoutNonce: results[0],
            activeItem: 'users',
            subtitle: 'Delete User: ' + targetUser.first_name + ' ' + targetUser.last_name,
            targetUser: targetUser,
            formNonce: results[1]
        });
    });
}

exports.performAdminDeleteUser = (req, res, next) => {
    let targetUser = res.locals.targetUser;

    const showError = (error) => {
        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-user-delete-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/delete-user/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-delete', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Delete User: ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Delete User: ' + targetUser.first_name + ' ' + targetUser.last_name,
                targetUser: targetUser,
                formNonce: results[1],
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-user-delete-form', '/admin/users/' + targetUser.user_id.toLowerCase() + '/delete-user/');
    
        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-users-user-delete', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Delete User: ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Delete User: ' + targetUser.first_name + ' ' + targetUser.last_name,
                targetUser: targetUser,
                formNonce: results[1],
                success: message
            });
        });
    }

    Nonce.verifyNonce('admin-user-delete-form', req.body.nonce, req.path).then(result => {
        if(result == true){
            Auth.deletePasswordFromDatabase(targetUser.user_id).then(result => {
                if(result == true){
                    targetUser.deleteUser().then(result => {
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

exports.showAdminUserPasswordsPage = (req, res, next) => {
    const showError = () => {
        Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {
            res.render('admin-users-user-security-passwords', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Passwords | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
                logoutNonce: result,
                activeItem: 'users',
                subtitle: 'Passwords | ' + targetUser.first_name + ' ' + targetUser.last_name
            });
        });
    }

    const targetUser = res.locals.targetUser;

    const serviceManager = new ServiceManager(targetUser.user_id);
    serviceManager.getServices().then(results => {
        var servicesWithPassword = [];

        results.forEach((rawService) => {
            var service = rawService.getSubclass();

            if(typeof service != 'string'){
                servicesWithPassword.push(service);
            }
        });

        Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {
            res.render('admin-users-user-security-passwords', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Passwords | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
                logoutNonce: result,
                activeItem: 'users',
                subtitle: 'Passwords | ' + targetUser.first_name + ' ' + targetUser.last_name,
                services: servicesWithPassword
            });
        });
    }, err => showError());
}

exports.showUserChangePasswordPage = (req, res, next) => {
    const targetUser = res.locals.targetUser;

    const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const changePasswordNoncePromise = Nonce.createNonce('admin-users-user-change-password', '/admin/users/' + targetUser.user_id.toLowerCase() + '/security/passwords/change-password/');

    Promise.all([logoutNoncePromise, changePasswordNoncePromise]).then(results => {
        res.render('admin-users-user-security-change-password', {
            useBootstrap: false,
            scriptsAfter: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'Change Password | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
            logoutNonce: results[0],
            activeItem: 'users',
            subtitle: 'Change Password | ' + targetUser.first_name + ' ' + targetUser.last_name,
            formNonce: results[1]
        });
    });
}

exports.performUserChangePassword = (req, res, next) => {
    const targetUser = res.locals.targetUser;

    const showError = (error) => {
        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const changePasswordNoncePromise = Nonce.createNonce('admin-users-user-change-password', '/admin/users/' + targetUser.user_id.toLowerCase() + '/security/passwords/change-password/');

        Promise.all([logoutNoncePromise, changePasswordNoncePromise]).then(results => {
            res.render('admin-users-user-security-change-password', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Change Password | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Change Password | ' + targetUser.first_name + ' ' + targetUser.last_name,
                formNonce: results[1],
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const changePasswordNoncePromise = Nonce.createNonce('admin-users-user-change-password', '/admin/users/' + targetUser.user_id.toLowerCase() + '/security/passwords/change-password/');

        Promise.all([logoutNoncePromise, changePasswordNoncePromise]).then(results => {
            res.render('admin-users-user-security-change-password', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Change Password | ' + targetUser.first_name + ' ' + targetUser.last_name + ' | Users | Admin',
                logoutNonce: results[0],
                activeItem: 'users',
                subtitle: 'Change Password | ' + targetUser.first_name + ' ' + targetUser.last_name,
                formNonce: results[1],
                success: message
            });
        });
    }

    Nonce.verifyNonce('admin-users-user-change-password', req.body.nonce, req.path).then(result => {
        if(result == true){            
            const newPassword = req.body.newPassword;
            const confirmPassword = req.body.confirmPassword;

            if(newPassword !== confirmPassword){
                showError("Passwords do not match");
            } else if (newPassword < 4){
                showError("Password must be at least 4 characters long");
            } else {
                Auth.encryptPassword(newPassword).then(result => {
                    result.push(targetUser.user_id);

                    Auth.savePasswordToDatabase({
                        all: result
                    }).then(result => {
                        if(result == true){
                            showSuccess("Password has been successfully changed");
                        } else {
                            showError("Cannot set your new password. Your password will remain unchanged.");
                        }
                    }, err => {
                        showError("Cannot set your new password. Your password will remain unchanged.");
                    });
                }, err => {
                    showError("Cannot set new password. Password will remain unchanged.");
                });
            }
        } else {
            showError("Error changing password. Please try again.");
        }
    }, err => {
        showError("Error changing password. Please try again.");
    });
}
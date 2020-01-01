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
const app = require('../../app');

exports.showMyAccountMyInfoPage = (req, res, next) => {
    Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {
        res.render('myaccount-my-info', {
            useBootstrap: false,
            scriptsAfter: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'My Information | My Account',
            logoutNonce: result,
            activeItem: 'my-info',
            subtitle: 'My Information'
        });
    });
}

exports.showMyAccountMyInfoNamePage = (req, res, next) => {
    let user = res.locals.user;

    if(!user.hasPrivilege('change_name')){
        res.render('error-custom', {
            useBootstrap: false,
            title: "Permission Denied",
            error: {
                title: "Permission Denied",
                message: "You do not have permission to change your name. Please contact your administrator."
            }
        });
    }

    let logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    let formNoncePromise = Nonce.createNonce('myaccount-my-info-name-form', '/accounts/myaccount/my-info/name/');

    Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
        res.render('myaccount-my-info-name', {
            useBootstrap: false,
            scriptsAfter: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'Name | My Information | My Account',
            logoutNonce: results[0],
            activeItem: 'my-info',
            subtitle: 'Name',
            firstName: user.first_name,
            lastName: user.last_name,
            formNonce: results[1]
        });
    });
}

exports.performMyAccountSaveName = (req, res, next) => {
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

        let logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        let formNoncePromise = Nonce.createNonce('myaccount-my-info-name-form', '/accounts/myaccount/my-info/name/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('myaccount-my-info-name', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Name | My Information | My Account',
                logoutNonce: results[0],
                activeItem: 'my-info',
                subtitle: 'Name',
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
        let logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        let formNoncePromise = Nonce.createNonce('myaccount-my-info-name-form', '/accounts/myaccount/my-info/name/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('myaccount-my-info-name', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Name | My Information | My Account',
                logoutNonce: results[0],
                activeItem: 'my-info',
                subtitle: 'Name',
                firstName: firstName,
                lastName: lastName,
                formNonce: results[1],
                success: message
            });
        });
    }

    Nonce.verifyNonce('myaccount-my-info-name-form', req.body.nonce, req.path).then(result => {
        if(result == true){
            if(!user.hasPrivilege('change_name')){
                showError("You do not have permission to change your name. Contact your administrator.");
            }

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
                            showSuccess("Successfully saved your details");
                        } else {
                            showError("Error saving your details. Please try again.");
                        }
                    }, err => {
                        showError("Error saving your details. Please try again.");
                    });
                }

                performSave();
            }
        } else {
            showError("Error saving your details. Please try again.");
        }
    }, err => {
        showError("Error saving your details. Please try again.");
    });
}

exports.showMyAccountMyInfoUsernamePage = (req, res, next) => {
    let user = res.locals.user;

    if(!user.hasPrivilege('change_username')){
        res.render('error-custom', {
            useBootstrap: false,
            title: "Permission Denied",
            error: {
                title: "Permission Denied",
                message: "You do not have permission to change your username. Please contact your administrator."
            }
        });
    }

    let logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    let formNoncePromise = Nonce.createNonce('myaccount-my-info-username-form', '/accounts/myaccount/my-info/username/');

    Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
        res.render('myaccount-my-info-username', {
            useBootstrap: false,
            scriptsAfter: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'Username | My Information | My Account',
            logoutNonce: results[0],
            activeItem: 'my-info',
            subtitle: 'Username',
            username: user.username,
            formNonce: results[1]
        });
    });
}

exports.performMyAccountSaveUsername = (req, res, next) => {
    let user = res.locals.user;

    let username = req.body.username;

    const showError = (error, invalidFields) => {
        let usernameInvalid = false;

        if(invalidFields != undefined){
            if(invalidFields.includes('username')){
                usernameInvalid = true;
            }
        }

        let logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        let formNoncePromise = Nonce.createNonce('myaccount-my-info-username-form', '/accounts/myaccount/my-info/username/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('myaccount-my-info-username', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Username | My Information | My Account',
                logoutNonce: results[0],
                activeItem: 'my-info',
                subtitle: 'Username',
                username: username,
                formNonce: results[1],
                usernameInvalid: usernameInvalid,
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        let logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        let formNoncePromise = Nonce.createNonce('myaccount-my-info-username-form', '/accounts/myaccount/my-info/username/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('myaccount-my-info-username', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Username | My Information | My Account',
                logoutNonce: results[0],
                activeItem: 'my-info',
                subtitle: 'Username',
                username: username,
                formNonce: results[1],
                success: message
            });
        });
    }

    Nonce.verifyNonce('myaccount-my-info-username-form', req.body.nonce, req.path).then(result => {
        if(result == true){
            if(!user.hasPrivilege('change_username')){
                showError("You do not have permission to change your username. Contact your administrator.");
            }

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
                            showSuccess("Successfully saved your details");
                        } else {
                            showError("Error saving your details. Please try again.");
                        }
                    }, err => {
                        showError("Error saving your details. Please try again.");
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
            showError("Error saving your details. Please try again.");
        }
    }, err => {
        showError("Error saving your details. Please try again.");
    });
}

exports.showMyAccountMyInfoDobPage = (req, res, next) => {
    let user = res.locals.user;

    if(!user.hasPrivilege('change_dob')){
        res.render('error-custom', {
            useBootstrap: false,
            title: "Permission Denied",
            error: {
                title: "Permission Denied",
                message: "You do not have permission to change your date of birth. Please contact your administrator."
            }
        });
    }

    let logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    let formNoncePromise = Nonce.createNonce('myaccount-my-info-dob-form', '/accounts/myaccount/my-info/dob/');

    Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
        res.render('myaccount-my-info-dob', {
            useBootstrap: false,
            scriptsAfter: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'Date of Birth | My Information | My Account',
            logoutNonce: results[0],
            activeItem: 'my-info',
            subtitle: 'Date of Birth',
            day: user.dob.getDate(),
            month: user.dob.getMonth() + 1,
            year: user.dob.getFullYear(),
            formNonce: results[1]
        });
    });
}

exports.performMyAccountSaveDob = (req, res, next) => {
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

        let logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        let formNoncePromise = Nonce.createNonce('myaccount-my-info-dob-form', '/accounts/myaccount/my-info/dob/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('myaccount-my-info-dob', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Date of Birth | My Information | My Account',
                logoutNonce: results[0],
                activeItem: 'my-info',
                subtitle: 'Date of Birth',
                day: day,
                month: month,
                year: year,
                formNonce: results[1],
                dayInvalid: dayInvalid,
                monthInvalid: monthInvalid,
                yearInvalid, yearInvalid,
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        let logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        let formNoncePromise = Nonce.createNonce('myaccount-my-info-dob-form', '/accounts/myaccount/my-info/dob/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('myaccount-my-info-dob', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Date of Birth | My Information | My Account',
                logoutNonce: results[0],
                activeItem: 'my-info',
                subtitle: 'Date of Birth',
                day: day,
                month: month,
                year: year,
                formNonce: results[1],
                success: message
            });
        });
    }

    Nonce.verifyNonce('myaccount-my-info-dob-form', req.body.nonce, req.path).then(result => {
        if(result == true){
            if(!user.hasPrivilege('change_dob')){
                showError("You do not have permission to change your date of birth. Contact your administrator.");
            }

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
                            showSuccess("Successfully saved your details");
                        } else {
                            showError("Error saving your details. Please try again.");
                        }
                    }, err => {
                        showError("Error saving your details. Please try again.");
                    });
                }

                performSave();
            }
        } else {
            showError("Error saving your details. Please try again.");
        }
    }, err => {
        showError("Error saving your details. Please try again.");
    });
}

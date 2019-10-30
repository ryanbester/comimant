/*
Copyright (C) 2019 Ryan Bester
*/

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const argon2 = require('argon2');
const multiparty = require('multiparty');

const Util = require('../core/util');
const { Auth, AccessToken, User, Nonce } = require('../core/auth');
const app = require('../app');

exports.showLoginPage = (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    const renderLoginPage = () => {
        Nonce.createNonce('user-login', '/accounts/login/').then(result => {
            res.render('login', {
                useBootstrap: false,
                scripts: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/login-page.js'
                ],
                title: 'Login',
                message: 'Login to the Bester Intranet',
                nonce: result
            });
        });
    }
    
    if(req.signedCookies['AUTHTOKEN'] !== undefined){
        const accessToken = new AccessToken(null, null, req.signedCookies['AUTHTOKEN']);
        accessToken.checkToken().then(result => {
            if(result == true){
                const user = new User(accessToken.user_id);
                user.verifyUser().then(result => {
                    if (result == true) {
                        res.redirect(301, 'https://www.besterintranet.' + Util.get_tld());
                    } else {
                        renderLoginPage();
                    }
                }, err => {
                    renderLoginPage();
                });
            } else {
                renderLoginPage();
            }
        }, err => {
            renderLoginPage();
        });
    } else {
        renderLoginPage();
    }
}

exports.login = (req, res, next) => {
    const renderError = (error) => {
        Nonce.createNonce('user-login', '/accounts/login/').then(result => {
            res.render('login', {
                useBootstrap: false,
                scripts: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/login-page.js'
                ],
                title: 'Login',
                message: 'Login to the Bester Intranet',
                error: error,
                username: username,
                emailDomain: emailDomain,
                nonce: result
            });
        });
    }

    const username = req.body.username;
    const emailDomain = req.body.emailDomain;
    const password = req.body.password;
    const rememberMe = req.body.remember_me;

    if(emailDomain === undefined || emailDomain == ''){
        renderError("Please enter a valid email address");
    }

    if(emailDomain.length < 2){
        renderError("Please enter a valid email address");
    }

    if(emailDomain.charAt(0) != '@'){
        renderError("Please enter a valid email address");
    }

    if(username === undefined || username === ''){
        renderError("Your username or password is incorrect");
    }

    if(password === undefined || password == ''){
        renderError("Your username or password is incorrect");
    }

    const nonce = req.body.nonce;
    Nonce.verifyNonce('user-login', nonce, req.path).then(result => {
        if(result == true){
            Auth.readPasswordFromDatabase(username + emailDomain).then(result => {
                // Verify the password
                Auth.verifyPassword(password, {
                    all: result
                }).then(result => {
                    if(result == false){
                        renderError("Your username or password is incorrect");
                    } else {
                        const user = result;

                        user.loadInfo().then(result => {
                            if(result == true){
                                // If authentication is successful, generate an access token
                                const accessToken = new AccessToken(user.user_id);

                                accessToken.saveTokenToDatabase().then(result => {
                                    if(rememberMe == 'true'){
                                        // Make the cookie last longer if the remember me option was checked
                                        var maxAge = accessToken.lifetime * 60 * 1000;
                                        var expires = accessToken.expiry;
                                        res.cookie('AUTHTOKEN', accessToken.id, {
                                            domain: 'besterintranet.' + Util.get_tld(),
                                            maxAge: maxAge,
                                            expires: expires,
                                            httpOnly: true,
                                            secure: true,
                                            signed: true
                                        });
                                    } else {
                                        res.cookie('AUTHTOKEN', accessToken.id, {
                                            domain: 'besterintranet.' + Util.get_tld(),
                                            httpOnly: true,
                                            secure: true,
                                            signed: true
                                        });
                                    }

                                    if(req.query.continue === undefined){
                                        res.redirect(301, 'https://www.besterintranet.' + Util.get_tld());
                                    } else {
                                        res.redirect(301, decodeURIComponent(req.query.continue));
                                    }
                                }, err => {
                                    renderError("Error logging you in. Please try again")
                                });
                            } else {
                                renderError("Error logging you in. Please try again");
                            }
                        }, err => {
                            renderError("Error logging you in. Please try again");
                        });
                    }
                }, err => {
                    renderError("Your username or password is incorrect");
                });
            }, err => {
                renderError("Your username or password is incorrect");
            });
        } else {
            renderError("Error logging you in. Please try again");
        }
    }, err => {
        renderError("Error logging you in. Please try again");
    });
}

exports.showPasswordConfirmationPage = (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    const renderPasswordConfirmationPage = () => {
        Nonce.createNonce('user-password-confirm', req.path).then(result => {
            res.render('password-confirm', {
                useBootstrap: false,
                scripts: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/password-confirm-page.js'
                ],
                title: 'Confirm it\'s you',
                message: 'Confirm it\'s you',
                email: res.locals.user.email_address,
                nonce: result
            });
        });
    }

    if(req.signedCookies['SATOKEN'] !== undefined){
        const accessToken = new AccessToken(null, null, req.signedCookies['SATOKEN']);
        accessToken.table = 'sudo_access_tokens';
        accessToken.checkToken().then(result => {
            if(result == true){
                next();
            } else {
                renderPasswordConfirmationPage();
            }
        }, err => {
            renderPasswordConfirmationPage();
        });
    } else {
        renderPasswordConfirmationPage();
    }
}

exports.checkPassword = (req, res, next) => {
    const user = res.locals.user;

    const renderError = (error) => {
        Nonce.createNonce('user-password-confirm', req.path).then(result => {
            res.render('password-confirm', {
                useBootstrap: false,
                scripts: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/password-confirm-page.js'
                ],
                title: 'Confirm it\'s you',
                message: 'Confirm it\'s you',
                error: error,
                email: user.email_address,
                nonce: result
            });
        });
    }

    const password = req.body.password;

    if(password === undefined || password == ''){
        renderError("Your password is incorrect");
    }

    const nonce = req.body.nonce;
    Nonce.verifyNonce('user-password-confirm', nonce, req.path).then(result => {
        if(result == true){
            Auth.readPasswordFromDatabase(user.email_address).then(result => {
                // Verify the password
                Auth.verifyPassword(password, {
                    all: result
                }).then(result => {
                    if(result == false){
                        renderError("Your password is incorrect");
                    } else {
                        const accessToken = new AccessToken(user.user_id, 30);
                        accessToken.table = 'sudo_access_tokens';

                        accessToken.saveTokenToDatabase().then(result => {
                            res.cookie('SATOKEN', accessToken.id, {
                                domain: 'accounts.besterintranet.' + Util.get_tld(),
                                httpOnly: true,
                                secure: true,
                                signed: true
                            });

                            const fullUrl = req.protocol + '://' + Util.url_rewrite(req.get('host'), req.url);
                            res.redirect(301, fullUrl);
                        }, err => {
                            renderError("Error confirming your identity. Please try again.")
                        });
                    }
                }, err => {
                    renderError("Your username or password is incorrect");
                });
            }, err => {
                renderError("Your username or password is incorrect");
            });
        } else {
            renderError("Error logging you in. Please try again");
        }
    }, err => {
        renderError("Error logging you in. Please try again");
    });
}

exports.logout = (req, res, next) => {
    Nonce.verifyNonce('user-logout', req.query.nonce, req.path).then(result => {
        if(result == true){
            if(req.signedCookies['AUTHTOKEN'] === undefined){
                res.redirect(301, 'https://www.besterintranet.' + Util.get_tld());
            } else {
                const accessToken = new AccessToken(null, null, req.signedCookies['AUTHTOKEN']);
                accessToken.deleteToken().then(result => {
                    res.clearCookie('AUTHTOKEN', {domain: 'besterintranet.' + Util.get_tld(), httpOnly: true, secure: true, signed: true});
                    res.redirect(301, 'https://www.besterintranet.' + Util.get_tld());
                }, err => {
                    res.clearCookie('AUTHTOKEN', {domain: 'besterintranet.' + Util.get_tld(), httpOnly: true, secure: true, signed: true});
                    res.redirect(301, 'https://www.besterintranet.' + Util.get_tld());
                })
            }
        } else {
            res.render('error-custom', {useBootstrap: false, title: "Error", error: {
                title: "Cannot log you out",
                message: "The nonce verification has failed"
            }});
        }
    }, err => {
        res.render('error-custom', {useBootstrap: false, title: "Error", error: {
            title: "Cannot log you out",
            message: "The nonce verification has failed"
        }});
    });    
}

exports.userCheck = (req, res, next) => {
    // Disable cache
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    const fullUrl = req.protocol + '://' + Util.url_rewrite(req.get('host'), req.url);

    if(req.signedCookies['AUTHTOKEN'] === undefined){
        res.redirect(301, 'https://accounts.besterintranet.' + Util.get_tld() + '/login/?continue=' + encodeURIComponent(fullUrl));
    } else {
        const accessToken = new AccessToken(null, null, req.signedCookies['AUTHTOKEN']);
        accessToken.checkToken().then(result => {
            if(result == true){
                const user = new User(accessToken.user_id);
                user.verifyUser().then(result => {
                    if (result == true) {
                        user.loadInfo().then(result => {
                            res.locals.user = user;
                            next();
                        }, err => {
                            next();
                        });
                    } else {
                        res.redirect(301, 'https://accounts.besterintranet.' + Util.get_tld() + '/login/?continue=' + encodeURIComponent(fullUrl));
                    }
                }, err => {
                    res.redirect(301, 'https://accounts.besterintranet.' + Util.get_tld() + '/login/?continue=' + encodeURIComponent(fullUrl));
                });
            } else {
                res.redirect(301, 'https://accounts.besterintranet.' + Util.get_tld() + '/login/?continue=' + encodeURIComponent(fullUrl));
            }
        }, err => {
            res.redirect(301, 'https://accounts.besterintranet.' + Util.get_tld() + '/login/?continue=' + encodeURIComponent(fullUrl));
        });
    }
}

exports.showMyAccountPage = (req, res, next) => {
    Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {
        res.render('myaccount-home', {
            useBootstrap: false,
            scripts: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'My Account',
            logoutNonce: result,
            activeItem: 'home',
        });
    });
}

exports.showMyAccountMyInfoPage = (req, res, next) => {
    Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {
        res.render('myaccount-my-info', {
            useBootstrap: false,
            scripts: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'My Information | My Account',
            logoutNonce: result,
            activeItem: 'my-info',
            subtitle: 'My Information'
        });
    });
}

exports.showMyAccountSecurityPage = (req, res, next) => {
    Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {
        res.render('myaccount-security', {
            useBootstrap: false,
            scripts: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'Security | My Account',
            logoutNonce: result,
            activeItem: 'security',
            subtitle: 'Security'
        });
    });
}

exports.showMyAccountServicesPage = (req, res, next) => {
    Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {
        res.render('myaccount-services', {
            useBootstrap: false,
            scripts: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'Services | My Account',
            logoutNonce: result,
            activeItem: 'services',
            subtitle: 'Services'
        });
    });
}

exports.showMyAccountDataPage = (req, res, next) => {
    Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {
        res.render('myaccount-data', {
            useBootstrap: false,
            scripts: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'Data | My Account',
            logoutNonce: result,
            activeItem: 'data',
            subtitle: 'Data'
        });
    });
}

exports.showMyAccountMyInfoNamePage = (req, res, next) => {
    let user = res.locals.user;

    let logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    let formNoncePromise = Nonce.createNonce('myaccount-my-info-name-form', '/accounts/myaccount/my-info/name/');

    Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
        res.render('myaccount-my-info-name', {
            useBootstrap: false,
            scripts: [
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
                scripts: [
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
                scripts: [
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

    let logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    let formNoncePromise = Nonce.createNonce('myaccount-my-info-username-form', '/accounts/myaccount/my-info/username/');

    Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
        res.render('myaccount-my-info-username', {
            useBootstrap: false,
            scripts: [
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
                scripts: [
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
                scripts: [
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
                    })
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

    let logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    let formNoncePromise = Nonce.createNonce('myaccount-my-info-dob-form', '/accounts/myaccount/my-info/dob/');

    Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
        res.render('myaccount-my-info-dob', {
            useBootstrap: false,
            scripts: [
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
                scripts: [
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
                scripts: [
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
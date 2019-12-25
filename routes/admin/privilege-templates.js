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
const AuthUtil = require('../../core/auth-util');
const { PrivilegeTemplate, PrivilegeTemplates } = require('../../core/admin/privilege-templates');
const app = require('../../app');

exports.showAdminPrivilegeTemplatesPage = (req, res, next) => {
    var noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    var ptPromise = PrivilegeTemplates.getPrivilegeTemplates();

    Promise.all([noncePromise, ptPromise]).then(results => {
        let nonce = results[0];
        let privilegeTemplates = results[1];

        res.render('admin-privilege-templates', {
            useBootstrap: false,
            scriptsAfter: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
            ],
            title: 'Privilege Templates | Admin',
            logoutNonce: nonce,
            activeItem: 'privilege-templates',
            subtitle: 'Privilege Templates',
            privilegeTemplates: privilegeTemplates
        });
    });
}

exports.showCreatePrivilegeTemplatePage = (req, res, next) => {
    const noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const formNoncePromise = Nonce.createNonce('admin-privilege-template-create-form', '/admin/privilege-templates/create/');

    Promise.all([noncePromise, formNoncePromise]).then(results => {    
        res.render('admin-privilege-templates-create', {
            useBootstrap: false,
            scriptsAfter: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
            ],
            title: 'Create Privilege Template | Privilege Templates | Admin',
            logoutNonce: results[0],
            activeItem: 'privilege-templates',
            subtitle: 'Create Privilege Template',
            formNonce: results[1]
        });
    });
}

exports.performCreatePrivilegeTemplate = (req, res, next) => {
    let name = req.body.name;
    let title = req.body.title;

    const showError = (error, invalidFields) => {
        let titleInvalid = false;

        if(invalidFields != undefined){
            if(invalidFields.includes('name')){
                nameInvalid = true;
            }
            if(invalidFields.includes('title')){
                titleInvalid = true;
            }
        }

        const noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-privilege-template-create-form', '/admin/privilege-templates/create/');

        Promise.all([noncePromise, formNoncePromise]).then(results => {    
            res.render('admin-privilege-templates-create', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
                ],
                title: 'Create Privilege Template | Privilege Templates | Admin',
                logoutNonce: results[0],
                activeItem: 'privilege-templates',
                subtitle: 'Create Privilege Template',
                name: name,
                ptTitle: title,
                formNonce: results[1],
                nameInvalid: nameInvalid,
                titleInvalid: titleInvalid,
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        const noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-privilege-template-create-form', '/admin/privilege-templates/create/');

        Promise.all([noncePromise, formNoncePromise]).then(results => {    
            res.render('admin-privilege-templates-create', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
                ],
                title: 'Create Privilege Template | Privilege Templates | Admin',
                logoutNonce: results[0],
                activeItem: 'privilege-templates',
                subtitle: 'Create Privilege Template',
                name: name,
                ptTitle: title,
                formNonce: results[1],
                success: message
            });
        });
    }

    Nonce.verifyNonce('admin-privilege-template-create-form', req.body.nonce, req.path).then(result => {
        if(result == true){
            // Validate fields
            invalidFields = [];

            if(name.length < 1){
                invalidFields.push('name');
            }

            if(title.length < 1){
                invalidFields.push('title');
            }

            if(invalidFields.length > 0){
                showError(invalidFields.length + " fields are invalid", invalidFields);
            } else {
                const performSave = () => {
                    let pt = new PrivilegeTemplate(name, title, {});

                    pt.savePrivilegeTemplate().then(result => {
                        if(result == true){
                            res.redirect(301, '../' + name.toLowerCase() + '/');
                        } else {
                            showError("Error adding privilege template. Please try again.");
                        }
                    }, err => {
                        showError("Error adding privilege template. Please try again.");
                    });
                }

                performSave();
            }
        } else {
            showError("Error adding privilege template. Please try again.");
        }
    }, err => {
        showError("Error adding privilege template. Please try again.");
    });
}

exports.loadPrivilegeTemplateInfo = (req, res, next) => {
    const showError = () => {
        Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {
            res.render('admin-privilege-template', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
                ],
                title: 'Unknown Privilege Template | Privilege Templates | Admin',
                logoutNonce: result,
                activeItem: 'privilege-templates',
                subtitle: 'Unknown Privilege Template'
            });
        });
    }

    const name = req.params.name;
    const pt = new PrivilegeTemplate(name);

    pt.loadInfo().then(result => {
        res.locals.pt = pt;
        next();
    }, err => showError());
}

exports.showPrivilegeTemplatePage = (req, res, next) => {
    const pt = res.locals.pt;

    const noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const formNoncePromise = Nonce.createNonce('admin-privilege-template-form', '/admin/privilege-templates/' + pt.name.toLowerCase() + '/');

    Promise.all([noncePromise, formNoncePromise]).then(results => {    
        res.render('admin-privilege-template', {
            useBootstrap: false,
            scriptsAfter: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
            ],
            title: pt.title + ' | Privilege Templates | Admin',
            logoutNonce: results[0],
            activeItem: 'privilege-templates',
            subtitle: pt.title,
            privilegeTemplate: pt,
            formNonce: results[1]
        });
    });
}

exports.performPrivilegeTemplateSave = (req, res, next) => {
    const pt = res.locals.pt;

    const showError = (error) => {
        const noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-privilege-template-form', '/admin/privilege-templates/' + pt.name.toLowerCase() + '/');

        Promise.all([noncePromise, formNoncePromise]).then(results => {    
            res.render('admin-privilege-template', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
                ],
                title: pt.title + ' | Privilege Templates | Admin',
                logoutNonce: results[0],
                activeItem: 'privilege-templates',
                subtitle: pt.title,
                privilegeTemplate: pt,
                formNonce: results[1],
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        const noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-privilege-template-form', '/admin/privilege-templates/' + pt.name.toLowerCase() + '/');

        Promise.all([noncePromise, formNoncePromise]).then(results => {    
            res.render('admin-privilege-template', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
                ],
                title: pt.title + ' | Privilege Templates | Admin',
                logoutNonce: results[0],
                activeItem: 'privilege-templates',
                subtitle: pt.title,
                privilegeTemplate: pt,
                formNonce: results[1],
                success: message
            });
        });
    }

    Nonce.verifyNonce('admin-privilege-template-form', req.body.nonce, req.path).then(result => {
        if(result == true){
            const performSave = () => {   
                Object.keys(req.body).forEach(name => {
                    if(name !== 'nonce'){
                        if(req.body[name] == 'granted'){
                            pt.addPrivilege(name);
                        } else if (req.body[name] == 'denied'){
                            pt.revokePrivilege(name);
                        }
                    }
                });

                pt.savePrivilegeTemplate().then(result => {
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

exports.showPrivilegeTemplateNamePage = (req, res, next) => {
    const pt = res.locals.pt;

    const noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const formNoncePromise = Nonce.createNonce('admin-privilege-template-name-form', '/admin/privilege-templates/' + pt.name.toLowerCase() + '/name/');

    Promise.all([noncePromise, formNoncePromise]).then(results => {    
        res.render('admin-privilege-template-name', {
            useBootstrap: false,
            scriptsAfter: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
            ],
            title: 'Name | ' + pt.title + ' | Privilege Templates | Admin',
            logoutNonce: results[0],
            activeItem: 'privilege-templates',
            subtitle: 'Name | ' + pt.title,
            name: pt.name,
            formNonce: results[1]
        });
    });
}

exports.performPrivilegeTemplateSaveName = (req, res, next) => {
    const pt = res.locals.pt;

    let name = req.body.name;

    const showError = (error, invalidFields) => {
        let nameInvalid = false;

        if(invalidFields != undefined){
            if(invalidFields.includes('name')){
                nameInvalid = true;
            }
        }

        const noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-privilege-template-name-form', '/admin/privilege-templates/' + pt.name.toLowerCase() + '/name/');

        Promise.all([noncePromise, formNoncePromise]).then(results => {    
            res.render('admin-privilege-template-name', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
                ],
                title: 'Name | ' + pt.title + ' | Privilege Templates | Admin',
                logoutNonce: results[0],
                activeItem: 'privilege-templates',
                subtitle: 'Name | ' + pt.title,
                name: name,
                nameInvalid: nameInvalid,
                formNonce: results[1],
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        const noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-privilege-template-name-form', '/admin/privilege-templates/' + pt.name.toLowerCase() + '/name/');

        Promise.all([noncePromise, formNoncePromise]).then(results => {    
            res.render('admin-privilege-template-name', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
                ],
                title: 'Name | ' + pt.title + ' | Privilege Templates | Admin',
                logoutNonce: results[0],
                activeItem: 'privilege-templates',
                subtitle: 'Name | ' + pt.title,
                name: name,
                formNonce: results[1],
                success: message
            });
        });
    }

    Nonce.verifyNonce('admin-privilege-template-name-form', req.body.nonce, req.path).then(result => {
        if(result == true){
            // Validate fields
            invalidFields = [];

            if(name.length < 1){
                invalidFields.push('name');
            }

            // Check if name has whitespace
            if(/\s/g.test(name)){
                invalidFields.push('name');
            }

            if(invalidFields.length > 0){
                showError(invalidFields.length + " fields are invalid", invalidFields);
            } else {
                const performSave = () => {
                    var oldName = pt.name;
                    pt.name = name;

                    pt.savePrivilegeTemplate(oldName).then(result => {
                        if(result == true){
                            showSuccess("Successfully saved privilege template name");
                        } else {
                            showError("Error saving privilege template name. Please try again.");
                        }
                    }, err => {
                        showError("Error saving privilege template name. Please try again.");
                    });
                }

                performSave();
            }
        } else {
            showError("Error saving privilege template name. Please try again.");
        }
    }, err => {
        showError("Error saving privilege template name. Please try again.");
    });
}

exports.showPrivilegeTemplateTitlePage = (req, res, next) => {
    const pt = res.locals.pt;

    const noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const formNoncePromise = Nonce.createNonce('admin-privilege-template-title-form', '/admin/privilege-templates/' + pt.name.toLowerCase() + '/title/');

    Promise.all([noncePromise, formNoncePromise]).then(results => {    
        res.render('admin-privilege-template-title', {
            useBootstrap: false,
            scriptsAfter: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
            ],
            title: 'Title | ' + pt.title + ' | Privilege Templates | Admin',
            logoutNonce: results[0],
            activeItem: 'privilege-templates',
            subtitle: 'Title | ' + pt.title,
            title: pt.title,
            formNonce: results[1]
        });
    });
}

exports.performPrivilegeTemplateSaveTitle = (req, res, next) => {
    const pt = res.locals.pt;

    let title = req.body.title;

    const showError = (error, invalidFields) => {
        let titleInvalid = false;

        if(invalidFields != undefined){
            if(invalidFields.includes('title')){
                titleInvalid = true;
            }
        }

        const noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-privilege-template-title-form', '/admin/privilege-templates/' + pt.name.toLowerCase() + '/title/');

        Promise.all([noncePromise, formNoncePromise]).then(results => {    
            res.render('admin-privilege-template-title', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
                ],
                title: 'Title | ' + pt.title + ' | Privilege Templates | Admin',
                logoutNonce: results[0],
                activeItem: 'privilege-templates',
                subtitle: 'Title | ' + pt.title,
                title: title,
                formNonce: results[1],
                titleInvalid: titleInvalid,
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        const noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-privilege-template-title-form', '/admin/privilege-templates/' + pt.name.toLowerCase() + '/title/');

        Promise.all([noncePromise, formNoncePromise]).then(results => {    
            res.render('admin-privilege-template-title', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
                ],
                title: 'Title | ' + pt.title + ' | Privilege Templates | Admin',
                logoutNonce: results[0],
                activeItem: 'privilege-templates',
                subtitle: 'Title | ' + pt.title,
                title: title,
                formNonce: results[1],
                success: message
            });
        });
    }

    Nonce.verifyNonce('admin-privilege-template-title-form', req.body.nonce, req.path).then(result => {
        if(result == true){
            // Validate fields
            invalidFields = [];

            if(title.length < 1){
                invalidFields.push('title');
            }

            if(invalidFields.length > 0){
                showError(invalidFields.length + " fields are invalid", invalidFields);
            } else {
                const performSave = () => {
                    pt.title = title;

                    pt.savePrivilegeTemplate().then(result => {
                        if(result == true){
                            showSuccess("Successfully saved privilege template title");
                        } else {
                            showError("Error saving privilege template title. Please try again.");
                        }
                    }, err => {
                        showError("Error saving privilege template title. Please try again.");
                    });
                }

                performSave();
            }
        } else {
            showError("Error saving privilege template title. Please try again.");
        }
    }, err => {
        showError("Error saving privilege template title. Please try again.");
    });
}

exports.showPrivilegeTemplateDefaultPage = (req, res, next) => {
    const pt = res.locals.pt;

    const noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const formNoncePromise = Nonce.createNonce('admin-privilege-template-default-form', '/admin/privilege-templates/' + pt.name.toLowerCase() + '/default/');

    Promise.all([noncePromise, formNoncePromise]).then(results => {    
        res.render('admin-privilege-template-default', {
            useBootstrap: false,
            scriptsAfter: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
            ],
            title: 'Default | ' + pt.title + ' | Privilege Templates | Admin',
            logoutNonce: results[0],
            activeItem: 'privilege-templates',
            subtitle: 'Default | ' + pt.title,
            defaultTemplate: pt.default_template,
            formNonce: results[1]
        });
    });
}

exports.performPrivilegeTemplateSaveDefault = (req, res, next) => {
    const pt = res.locals.pt;

    let defaultTemplate = req.body.default_template == 'yes' ? 1 : 0;

    const showError = (error) => {
        const noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-privilege-template-default-form', '/admin/privilege-templates/' + pt.name.toLowerCase() + '/default/');

        Promise.all([noncePromise, formNoncePromise]).then(results => {    
            res.render('admin-privilege-template-default', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
                ],
                title: 'Default | ' + pt.title + ' | Privilege Templates | Admin',
                logoutNonce: results[0],
                activeItem: 'privilege-templates',
                subtitle: 'Default | ' + pt.title,
                defaultTemplate: defaultTemplate,
                formNonce: results[1],
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        const noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-privilege-template-default-form', '/admin/privilege-templates/' + pt.name.toLowerCase() + '/default/');

        Promise.all([noncePromise, formNoncePromise]).then(results => {    
            res.render('admin-privilege-template-default', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
                ],
                title: 'Default | ' + pt.title + ' | Privilege Templates | Admin',
                logoutNonce: results[0],
                activeItem: 'privilege-templates',
                subtitle: 'Default | ' + pt.title,
                defaultTemplate: defaultTemplate,
                formNonce: results[1],
                success: message
            });
        });
    }

    Nonce.verifyNonce('admin-privilege-template-default-form', req.body.nonce, req.path).then(result => {
        if(result == true){
            const performSave = () => {
                pt.default_template = defaultTemplate;

                pt.savePrivilegeTemplate().then(result => {
                    if(result == true){
                        showSuccess("Successfully saved privilege template default status");
                    } else {
                        showError("Error saving privilege template default status. Please try again.");
                    }
                }, err => {
                    showError("Error saving privilege template default status. Please try again.");
                });
            }

            performSave();
        } else {
            showError("Error saving privilege template default status. Please try again.");
        }
    }, err => {
        showError("Error saving privilege template default status. Please try again.");
    });
}

exports.showPrivilegeTemplateAddPrivilegePage = (req, res, next) => {
    const pt = res.locals.pt;

    const noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const formNoncePromise = Nonce.createNonce('admin-privilege-template-add-privilege-form', '/admin/privilege-templates/' + pt.name.toLowerCase() + '/add-privilege/');

    Promise.all([noncePromise, formNoncePromise]).then(results => {    
        res.render('admin-privilege-template-add-privilege', {
            useBootstrap: false,
            scriptsAfter: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
            ],
            title: 'Add Privilege | ' + pt.title + ' | Privilege Templates | Admin',
            logoutNonce: results[0],
            activeItem: 'privilege-templates',
            subtitle: 'Add Privilege | ' + pt.title,
            granted: 1,
            formNonce: results[1]
        });
    });
}

exports.performPrivilegeTemplateAddPrivilege = (req, res, next) => {
    const pt = res.locals.pt;

    let name = req.body.name;
    let granted = req.body.granted == 'granted' ? 1 : 0;

    const showError = (error, invalidFields) => {
        let nameInvalid = false;

        if(invalidFields != undefined){
            if(invalidFields.includes('name')){
                nameInvalid = true;
            }
        }

        const noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-privilege-template-add-privilege-form', '/admin/privilege-templates/' + pt.name.toLowerCase() + '/add-privilege/');

        Promise.all([noncePromise, formNoncePromise]).then(results => {    
            res.render('admin-privilege-template-add-privilege', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
                ],
                title: 'Add Privilege | ' + pt.title + ' | Privilege Templates | Admin',
                logoutNonce: results[0],
                activeItem: 'privilege-templates',
                subtitle: 'Add Privilege | ' + pt.title,
                name: name,
                granted: granted,
                formNonce: results[1],
                nameInvalid: nameInvalid,
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        const noncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-privilege-template-add-privilege-form', '/admin/privilege-templates/' + pt.name.toLowerCase() + '/add-privilege/');

        Promise.all([noncePromise, formNoncePromise]).then(results => {    
            res.render('admin-privilege-template-add-privilege', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/admin.js'
                ],
                title: 'Add Privilege | ' + pt.title + ' | Privilege Templates | Admin',
                logoutNonce: results[0],
                activeItem: 'privilege-templates',
                subtitle: 'Add Privilege | ' + pt.title,
                name: name,
                granted: granted,
                formNonce: results[1],
                success: message
            });
        });
    }

    Nonce.verifyNonce('admin-privilege-template-add-privilege-form', req.body.nonce, req.path).then(result => {
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
                    pt.addPrivilege(name);

                    if(granted != 1){
                        pt.revokePrivilege(name);
                    }

                    pt.savePrivilegeTemplate().then(result => {
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

exports.showPrivilegeTemplateDeletePage = (req, res, next) => {
    const pt = res.locals.pt;

    const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
    const formNoncePromise = Nonce.createNonce('admin-privilege-template-delete-form', '/admin/privilege-templates/' + pt.name.toLowerCase() + '/delete-privilege-template/');

    Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
        res.render('admin-privilege-template-delete', {
            useBootstrap: false,
            scriptsAfter: [
                'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
            ],
            title: 'Delete Privilege Template: ' + pt.title + ' | Privilege Templates | Admin',
            logoutNonce: results[0],
            activeItem: 'privilege-templates',
            subtitle: 'Delete Privilege Template: ' + pt.title,
            formNonce: results[1]
        });
    });
}

exports.performPrivilegeTemplateDelete = (req, res, next) => {
    let pt = res.locals.pt;

    const showError = (error) => {
        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-privilege-template-delete-form', '/admin/privilege-templates/' + pt.name.toLowerCase() + '/delete-privilege-template/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-privilege-template-delete', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Delete Privilege Template: ' + pt.title + ' | Privilege Templates | Admin',
                logoutNonce: results[0],
                activeItem: 'privilege-templates',
                subtitle: 'Delete Privilege Template: ' + pt.title,
                formNonce: results[1],
                error: error
            });
        });
    }

    const showSuccess = (message) => {
        const logoutNoncePromise = Nonce.createNonce('user-logout', '/accounts/logout/');
        const formNoncePromise = Nonce.createNonce('admin-privilege-template-delete-form', '/admin/privilege-templates/' + pt.name.toLowerCase() + '/delete-privilege-template/');

        Promise.all([logoutNoncePromise, formNoncePromise]).then(results => {
            res.render('admin-privilege-template-delete', {
                useBootstrap: false,
                scriptsAfter: [
                    'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
                ],
                title: 'Delete Privilege Template: ' + pt.title + ' | Privilege Templates | Admin',
                logoutNonce: results[0],
                activeItem: 'privilege-templates',
                subtitle: 'Delete Privilege Template: ' + pt.title,
                formNonce: results[1],
                success: message
            });
        });
    }

    Nonce.verifyNonce('admin-privilege-template-delete-form', req.body.nonce, req.path).then(result => {
        if(result == true){
            pt.deletePrivilegeTemplate().then(result => {
                if(result == true){
                    res.redirect(301, '../../');
                } else {
                    showError("Error deleting privilege template. Please try again.");
                }
            }, err => {
                showError("Error deleting privilege template. Please try again.");
            });
        } else {
            showError("Error deleting privilege template. Please try again.");
        }
    }, err => {
        showError("Error deleting privilege template. Please try again.");
    });
}
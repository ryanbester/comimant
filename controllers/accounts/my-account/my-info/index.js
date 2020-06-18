/*
 * Copyright (C) 2019 - 2020 Comimant
 */

const { Nonce } = require('../../../../core/auth/nonce');

exports.showMyInfoPage = (req, res) => {
    let privilegePromises = [
        res.locals.user.hasPrivilege('account.info.change_name'),
        res.locals.user.hasPrivilege('account.info.change_username'),
        res.locals.user.hasPrivilege('account.info.change_dob')
    ];

    Nonce.createNonce('user-logout', '/accounts/logout').then(nonce => {
        Promise.all(privilegePromises).then(results => {
            const [changeName, changeUsername, changeDob] = results;

            res.render('accounts/my-account/my-info/index', {
                ...res.locals.stdArgs,
                title: 'My Information | My Account',
                logoutNonce: nonce,
                activeItem: 'my-info',
                subtitle: 'My Information',
                privileges: {
                    changeName: changeName,
                    changeUsername: changeUsername,
                    changeDob: changeDob
                }
            });
        });
    });
};
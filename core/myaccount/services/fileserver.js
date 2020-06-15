/*
Copyright (C) 2019-2020 Bester Intranet
*/

const { Service } = require('../servicemanager');
const Util = require('../../util');
const { Auth, AccessToken, User, Nonce } = require('../../auth');

module.exports.FileServer = class FileServer extends Service {
    constructor(user_id, type, name, title, service_user_id){
        super(user_id, type, name, title, service_user_id);
    }

    detailsPage(req, res, next, path) {
        const user = res.locals.user;

        if(path == ''){
            Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {
                res.render('myaccount-service-fileserver', {
                    useBootstrap: false,
                    scripts: [
                        'https://' + res.locals.main_domain + '/scripts/myaccount.js'
                    ],
                    title: this.title + ' Services | My Account',
                    logoutNonce: result,
                    activeItem: 'services',
                    subtitle: this.title,
                    service: this
                });
            });
        } else {
            res.send(path);
        }
    }
}
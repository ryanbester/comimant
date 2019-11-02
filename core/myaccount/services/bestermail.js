/*
Copyright (C) 2019 Bester Intranet
*/

const { Service } = require('../servicemanager');
const Util = require('../../../core/util');
const { Auth, AccessToken, User, Nonce } = require('../../../core/auth');

module.exports.BesterMail = class BesterMail extends Service {
    constructor(user_id, type, name, title, service_user_id){
        super(user_id, type, name, title, service_user_id);

        this.passwordPage = 'password/';
    }

    detailsPage(req, res, next, path) {
        const user = res.locals.user;

        if(path == ''){
            Nonce.createNonce('user-logout', '/accounts/logout/').then(result => {
                res.render('myaccount-service-bestermail', {
                    useBootstrap: false,
                    scripts: [
                        'https://www.besterintranet.' + Util.get_tld() + '/scripts/myaccount.js'
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
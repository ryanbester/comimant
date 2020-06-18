/*
 * Copyright (C) 2019 - 2020 Comimant
 */

const { Util } = require('./util');
const { Config } = require('./config');

module.exports.Domains = class Domains {
    constructor(host) {
        this.host = host;
        const domains = Config.getInstance().getOption('domains');

        for (let i = 0; i < domains.length; i++) {
            const { root } = domains[i];
            if (host.endsWith(root.domain)) {
                this.domainObject = domains[i];
            }
        }
    }

    getRootDomain() {
        if (this.domainObject === undefined) {
            return this.host;
        }

        const { root } = this.domainObject;
        return root;
    }

    getMainDomain() {
        if (this.domainObject === undefined) {
            return this.host;
        }

        const { main } = this.domainObject;
        return main;
    }

    getAuthDomain() {
        if (this.domainObject === undefined) {
            return this.host;
        }

        const { auth } = this.domainObject;
        return auth;
    }

    getStaticDomain() {
        if (this.domainObject === undefined) {
            return this.host;
        }

        const { static: static_domain } = this.domainObject;
        return static_domain;
    }

    getAccountsDomain() {
        if (this.domainObject === undefined) {
            return this.host;
        }

        const { accounts } = this.domainObject;
        return accounts;
    }

};
/*
 * Comimant
 * Copyright (C) 2019 - 2020 Ryan Bester
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

const { Util } = require('./util');
const { Config } = require('./config');

/**
 * Class to save domain objects so the config does not have to be queried on every request.
 */
class DomainState {
    /**
     * Contains a key-value pair of hostnames and their domain objects for quicker access.
     * @type {object}
     */
    static savedDomains = {};

    /**
     * Creates a new DomainState object.
     */
    constructor() {

    }

    /**
     * Gets the current DomainState instance.
     * @return {DomainState} The instance.
     */
    static getInstance() {
        if (DomainState.instance === undefined) {
            DomainState.instance = new DomainState();
        }

        return DomainState.instance;
    }

    /**
     * Gets the domain object for the hostname.
     * @param {string} host The hostname.
     * @return {object} The domain object.
     */
    getDomainObj(host) {
        const domains = Config.getInstance().getOption('domains');

        if (DomainState.savedDomains.hasOwnProperty(host)) {
            return DomainState.savedDomains[host];
        }

        for (let i = 0; i < domains.length; i++) {
            const { root } = domains[i];
            if (host.endsWith(root.domain)) {
                DomainState.savedDomains[host] = domains[i];
                return domains[i];
            }
        }
    }
}

/**
 * Utility class for managing domains.
 * @type {Domains}
 */
module.exports.Domains = class Domains {

    /**
     * Creates a new Domains object.
     * @param {string} host The hostname.
     */
    constructor(host) {
        this.host = host;
        this.domainObject = DomainState.getInstance().getDomainObj(host);
    }

    /**
     * Gets the root domain.
     * @return {string} The root domain.
     */
    getRootDomain() {
        if (this.domainObject === undefined) {
            return this.host;
        }

        const { root } = this.domainObject;
        return root;
    }

    /**
     * Gets the main domain.
     * @return {string} The main domain.
     */
    getMainDomain() {
        if (this.domainObject === undefined) {
            return this.host;
        }

        const { main } = this.domainObject;
        return main;
    }

    /**
     * Gets the auth domain.
     * @return {string} The auth domain.
     */
    getAuthDomain() {
        if (this.domainObject === undefined) {
            return this.host;
        }

        const { auth } = this.domainObject;
        return auth;
    }

    /**
     * Gets the static domain.
     * @return {string} The static domain.
     */
    getStaticDomain() {
        if (this.domainObject === undefined) {
            return this.host;
        }

        const { static: static_domain } = this.domainObject;
        return static_domain;
    }

    /**
     * Gets the accounts domain.
     * @return {string} The accounts domain.
     */
    getAccountsDomain() {
        if (this.domainObject === undefined) {
            return this.host;
        }

        const { accounts } = this.domainObject;
        return accounts;
    }

};
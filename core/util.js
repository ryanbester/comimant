/*
 * Copyright (C) 2019 - 2020 Comimant
 */

const { Config } = require('./config');
//const { Domains } = require('./domains');

/**
 * Class containing various helper methods.
 * @type {Util}
 */
module.exports.Util = class Util {

    /**
     * Rewrites the URL to allow for different subdomains.
     * @param host The host.
     * @param url The URL.
     * @return {string} The new URL.
     */

    /*static urlRewrite(host, url) {
        let newUrl;

        if (url.startsWith('/accounts/')) {
            let domainObj = new Domains(host);
            let accountsDomain = domainObj.getAccountsDomain();
            if (host === accountsDomain) {
                url = url.replace('/accounts', '');
                newUrl = host + url;
            }
        }

        if (newUrl === undefined) {
            return host + url;
        }

        return newUrl;
    }*/

    /**
     * Gets the full path including the mount point
     * @param {string} originalUrl The original URL. This should be set to req.originalUrl.
     * @return {string} The full path.
     */
    static getFullPath(originalUrl) {
        const index = originalUrl.indexOf('?');
        return originalUrl.substring(0, index === -1 ? undefined : index);
    }

    /**
     * Gets the file that called the function. Used for detecting if plugins are calling restricted methods.
     * @return {string} The file that called the method.
     */
    static getCallerFile() {
        const originalFunc = Error.prepareStackTrace;
        let callerFile;

        try {
            const err = new Error();
            Error.prepareStackTrace = (err, stack) => {
                return stack;
            };

            err.stack.shift();

            const currentFile = err.stack.shift().getFileName();

            while (err.stack.length) {
                callerFile = err.stack.shift().getFileName();

                if (currentFile !== callerFile) {
                    break;
                }
            }
        } catch (e) {

        }

        Error.prepareStackTrace = originalFunc;

        return callerFile;
    }

    /**
     * Gets the current protocol depending if SSL is enabled or not.
     * @return {string} The current protocol.
     */
    static getProtocol(domain) {
        const { security } = domain;
        const { ssl_enabled } = security;

        return (ssl_enabled === false ? 'http://' : 'https://');
    }

    /**
     * Returns the string if it is not null or empty, otherwise returns a default value.
     * @param {string} string The string.
     * @param {string} defaultValue The default value.
     * @return {string} The coalesced string.
     */
    static coalesceString(string, defaultValue) {
        if (string == null) {
            return defaultValue;
        }

        if (string === '') {
            return defaultValue;
        }

        return string;
    }

    /**
     * Returns the color if it is valid, otherwise returns a default color.
     * @param {string} color The color to check.
     * @param {string} defaultValue The default value.
     * @return {string} The coalesced color.
     */
    static coalesceColour(color, defaultValue) {
        if (color == null) {
            return defaultValue;
        }

        if (/^#[0-9A-F]{6}$/i.test(color)) {
            return color;
        }

        return defaultValue;
    }

};

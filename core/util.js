/*
 * Copyright (C) 2019 - 2020 Bester Intranet
 */

const { Domains } = require('./domains');

module.exports.Util = class Util {
    static getTLD() {
        if (process.env.NODE_ENV === 'development') {
            return 'dev';
        } else {
            return 'com';
        }
    }

    static urlRewrite(host, url) {
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
    }

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
};

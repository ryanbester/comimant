/*
Copyright (C) 2019-2020 Bester Intranet
*/

const get_tld = () => {
    if(process.env.NODE_ENV == 'development'){
        return "dev";
    } else {
        return "com";
    }
}

const get_domain_object = (host) => {
    var domains = JSON.parse(process.env.DOMAINS);

    for(var i = 0; i < domains.length; i++) {
        if(host.endsWith(domains[i].root_domain)) {
            return domains[i];
        }
    }
    
    return undefined;
}

const get_root_domain = (host, domain_object) => {
    if(domain_object === undefined) {
        return host;
    }

    return domain_object.root_domain;
}

const get_domain = (host, domain_object) => {
    if(domain_object === undefined) {
        return host;
    }

    return domain_object.domain;
}

const get_auth_domain = (host, domain_object) => {
    if(domain_object === undefined) {
        return host;
    }

    return domain_object.auth;
}

const get_static_domain = (host, domain_object) => {
    if(domain_object === undefined) {
        return host;
    }

    return domain_object.static;
}

const get_accounts_domain = (host, domain_object) => {
    if(domain_object === undefined) {
        return host;
    }

    return domain_object.accounts;
}

const url_rewrite = (host, url) => {
    var newUrl;

    if(url.startsWith('/accounts/')){
        let domainObject = get_domain_object(host);
        let accountsDomain = get_accounts_domain(host, domainObject);
        if(host == accountsDomain){
            url = url.replace('/accounts', '');
            newUrl = host + url;
        }
    }
    
    if(newUrl === undefined){
        return host + url;
    }

    return newUrl;
}

const log_colors = {
    RESET: '\x1b[0m',
    BRIGHT: '\x1b[1m',
    DIM: '\x1b[2m',
    UNDERSCORE: '\x1b[4m',
    BLINK: '\x1b[5m',
    REVERSE: '\x1b[7m',
    HIDDEN: '\x1b[8m',
    FG_BLACK: '\x1b[30m',
    FG_RED: '\x1b[31m',
    FG_GREEN: '\x1b[32m',
    FG_YELLOW: '\x1b[33m',
    FG_BLUE: '\x1b[34m',
    FG_MAGENTA: '\x1b[35m',
    FG_CYAN: '\x1b[36m',
    FG_WHITE: '\x1b[37m',
    BG_BLACK: '\x1b[40m',
    BG_RED: '\x1b[41m',
    BG_GREEN: '\x1b[42m',
    BG_YELLOW: '\x1b[43m',
    BG_BLUE: '\x1b[44m',
    BG_MAGENTA: '\x1b[45m',
    BG_CYAN: '\x1b[46m',
    BG_WHITE: '\x1b[47m'
}

const getCallerFile = () => {
    var originalFunc = Error.prepareStackTrace;
    var callerFile;

    try {
        var err = new Error();

        Error.prepareStackTrace = (err, stack) => { return stack };

        err.stack.shift();

        var currentFile = err.stack.shift().getFileName();

        while(err.stack.length) {
            callerFile = err.stack.shift().getFileName();

            if(currentFile != callerFile) {
                break;
            }
        }
    } catch (e) {

    }

    Error.prepareStackTrace = originalFunc;

    return callerFile;
}

module.exports = {
    get_tld: get_tld,
    get_domain_object: get_domain_object,
    get_root_domain: get_root_domain,
    get_domain: get_domain,
    get_auth_domain: get_auth_domain,
    get_static_domain: get_static_domain,
    get_accounts_domain: get_accounts_domain,
    url_rewrite: url_rewrite,
    log_colors: log_colors,
    getCallerFile: getCallerFile
};
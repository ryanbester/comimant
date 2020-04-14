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

const url_rewrite = (host, url) => {
    var newUrl;

    if(url.startsWith('/accounts/')){
        if(host == 'accounts.besterintranet.' + get_tld()){
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
    url_rewrite: url_rewrite,
    log_colors: log_colors,
    getCallerFile: getCallerFile
};
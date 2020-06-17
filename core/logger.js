/*
 * Copyright (C) 2019 - 2020 Comimant
 */

module.exports.Logger = class Logger {
    static log(message) {
        console.log(message + exports.LoggerColors.RESET);
    }

    static error(message) {
        this.log(exports.LoggerColors.FG_RED + message);
    }

    static securityWarning(message) {
        this.log(
            exports.LoggerColors.BG_RED + exports.LoggerColors.FG_WHITE + 'Security Warning:' + exports.LoggerColors.RESET + exports.LoggerColors.FG_RED + ' ' + message);
    }
};

module.exports.LoggerColors = {
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
};
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

/**
 * Utility class for logging to the console.
 * @type {Logger}
 */
module.exports.Logger = class Logger {

    /**
     * Log a message to the console.
     * @param {string} message The message to log.
     */
    static log(message) {
        console.log(message + exports.LoggerColors.RESET);
    }

    /**
     * Logs an error message to the console. The text will be formatted in red.
     * @param {string} message The message to log.
     */
    static error(message) {
        this.log(exports.LoggerColors.FG_RED + message);
    }

    /**
     * Logs a warning message to the console. The text will be formatted in yellow.
     * @param {string} message The message to log.
     */
    static warning(message) {
        this.log(exports.LoggerColors.FG_YELLOW + message);
    }

    /**
     * Losg a security warning message to the console. The text will have a red background.
     * @param {string} message The message to log.
     */
    static securityWarning(message) {
        this.log(
            exports.LoggerColors.BG_RED + exports.LoggerColors.FG_WHITE + 'Security Warning:' + exports.LoggerColors.RESET + exports.LoggerColors.FG_RED + ' ' + message);
    }

};

/**
 * Utility class containing log colour codes.
 * @type {{BG_CYAN: string, UNDERSCORE: string, BG_MAGENTA: string, BG_RED: string, DIM: string, BG_BLUE: string,
 *     RESET: string, HIDDEN: string, BG_BLACK: string, FG_BLUE: string, FG_BLACK: string, FG_GREEN: string, FG_CYAN:
 *     string, FG_MAGENTA: string, BLINK: string, BG_YELLOW: string, BG_GREEN: string, REVERSE: string, FG_RED: string,
 *     FG_YELLOW: string, BRIGHT: string, FG_WHITE: string, BG_WHITE: string}}
 */
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
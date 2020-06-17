/*
 * Copyright (C) 2019 - 2020 Comimant
 */

/**
 * Static class containing sanitizer methods.
 * @type {Sanitizer}
 */
module.exports.Sanitizer = class Sanitizer {

    /**
     * Sanitizes a string.
     * @param {string} string The string to sanitize.
     * @return {boolean|string} The sanitized string or false on failure.
     */
    static string(string) {
        if (string === undefined) {
            return false;
        }

        if (string == null) {
            return false;
        }

        if (!string instanceof String) {
            return false;
        }

        if (string === '') {
            return false;
        }

        // Strip HTML tags
        string = string.replace(/(<([^>]+)>)/ig, '');

        return string;
    }

    /**
     * Sanitizes a number.
     * @param {number} number The number to sanitize.
     * @return {boolean|number} The sanitized number or false on failure.
     */
    static number(number) {
        if (number === undefined) {
            return false;
        }

        if (number == null) {
            return false;
        }

        if (!number instanceof Number) {
            return false;
        }

        return number;
    }

};
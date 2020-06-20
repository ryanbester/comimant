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

        // If new string is empty
        if (string === '') {
            return false;
        }

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

    /**
     * Strips whitespace from a string. This should be called after the string method.
     * @param {string} string The string.
     * @return {boolean|string} The sanitized string or false on failure.
     */
    static whitespace(string) {
        if (string === false) {
            return false;
        }

        // Strip whitespace
        string = string.replace(/\s/g, '');

        // If new string is empty
        if (string === '') {
            return false;
        }

        return string;
    }

    /**
     * Strips non ASCII characters from a string. This should be called after the string method.
     * @param {string} string The string.
     * @return {boolean|string} The sanitized string or false on failure.
     */
    static ascii(string) {
        if (string === false) {
            return false;
        }

        // Strip non ASCII characters
        string = string.replace(/[^\x00-\x7F]/g, '');

        // If new string is empty
        if (string === '') {
            return false;
        }

        return string;
    }

};
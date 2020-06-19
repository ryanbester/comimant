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

const crypto = require('crypto');
require('datejs');

const mysql = require('../../db/mysql');

/**
 * Class representing a nonce.
 * @type {Nonce}
 */
module.exports.Nonce = class Nonce {

    /**
     * Creates a new nonce and saves it to the database.
     * @param {string} name The name.
     * @param {string} url The URL.
     * @return {Promise<string>|Promise<Error>} The nonce ID.
     */
    static createNonce(name, url) {
        return new Promise((resolve, reject) => {
            // Generate an ID
            let rawID = crypto.randomBytes(8).toString('hex');

            // Encrypt the ID
            let id = crypto.createHash('sha256').update(rawID).digest('hex');

            // Generate the expiry date
            const expiry = Date.today().setTimeToNow().addHours(24).toString('u').slice(0, -1);

            // Check if the ID is already in the database
            const checkID = _ => {
                return new Promise((resolve, reject) => {
                    // Create a connection to the database
                    const connection = mysql.getConnection();

                    // Open the connection
                    connection.connect();

                    // Execute the query to check for the ID
                    connection.query(
                        'SELECT COUNT(*) AS IDCount FROM nonces WHERE ID = UNHEX(' + connection.escape(id) + ')',
                        (error, results) => {
                            // Close the connection
                            connection.end();

                            if (error) {
                                reject(error);
                                return;
                            }

                            // If the ID is in the database, generate a new ID and continue the loop
                            const { IDCount } = results[0];
                            if (IDCount > 0) {
                                id = crypto.randomBytes(8).toString('hex');
                                resolve(true);
                            } else {
                                // End the loop
                                resolve(false);
                            }
                        });
                });
            };

            // Create a loop
            ((data, condition, action) => {
                const whilst = data => {
                    // If ID is not in the database, end the loop
                    return condition(data) ? action(data).then(whilst) : Promise.resolve(data);
                };
                return whilst(data);
            })(true, idFound => idFound, checkID).then(_ => {
                // Create a connection to the database
                const connection = mysql.getConnection('modify');

                // Open the connection
                connection.connect();

                // Execute the query to insert the nonce into the database
                connection.query('INSERT INTO nonces VALUES('
                    + 'UNHEX(' + connection.escape(id) + '), '
                    + connection.escape(name) + ', '
                    + connection.escape(url) + ', '
                    + connection.escape(expiry) + ')',
                    (error) => {
                        // Close the connection
                        connection.end();

                        if (error) {
                            reject(error);
                            return;
                        }

                        resolve(rawID);
                    });
            });
        });
    }

    /**
     * Verifies if a nonce is valid, and deletes it from the database if it is.
     * @param {string} name The name.
     * @param {string} id The ID.
     * @param {string} url The URL.
     * @return {Promise<boolean>|Promise<Error>} True if the nonce is valid.
     */
    static verifyNonce(name, id, url) {
        return new Promise((resolve, reject) => {
            // SHA-256 the ID
            const hash = crypto.createHash('sha256').update(id).digest('hex');

            // Create a connection to the database
            const connection = mysql.getConnection();

            // Open the connection
            connection.connect();

            // Check if the nonce is in the database
            connection.query('SELECT * FROM nonces WHERE id = UNHEX(' + connection.escape(hash) + ')',
                (error, results) => {
                    // Close the connection
                    connection.end();

                    if (error) {
                        reject(error);
                        return;
                    }

                    // If the nonce is not found, return an error
                    if (results === undefined || results.length === 0) {
                        reject('Nonce not found');
                    } else {
                        // If nonce matches the name
                        if (results[0].name !== name) {
                            reject('Nonce invalid');
                        } else {
                            // If nonce has a different URL, return an error
                            if (results[0].url !== url) {
                                reject('Nonce invalid');
                            } else {
                                // If nonce has expired, return an error
                                if (Date.parse(results[0].expires) < Date.today()) {
                                    reject('Nonce has expired');
                                } else {
                                    // Delete the nonce

                                    // Create a connection to the database
                                    const connection = mysql.getConnection('delete');

                                    // Open the connection
                                    connection.connect();

                                    // Execute the delete query
                                    connection.query(
                                        'DELETE FROM nonces WHERE id = UNHEX(' + connection.escape(hash) + ')',
                                        (error) => {
                                            // Close the connection
                                            connection.end();

                                            if (error) {
                                                reject(error);
                                                return;
                                            }

                                            resolve(true);
                                        });
                                }
                            }
                        }
                    }
                });
        });
    }

    /**
     * Deletes all nonces from the database.
     * @return {Promise<boolean>|Promise<Error>} True on success.
     */
    static deleteAllNonces() {
        return new Promise((resolve, reject) => {
            // Create a connection to the database
            const connection = mysql.getConnection('delete');

            // Open the connection
            connection.connect();

            // Execute the delete query
            connection.query('DELETE FROM nonces',
                (error) => {
                    // Close the connection
                    connection.end();

                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve(true);
                });
        });
    }

    /**
     * Deletes all expired nonces from the database.
     * @return {Promise<boolean>|Promise<Error>} True on success.
     */
    static deleteExpiredNonces() {
        return new Promise((resolve, reject) => {
            // Create a connection to the database
            const connection = mysql.getConnection('delete');

            // Open the connection
            connection.connect();

            // Execute the delete query
            connection.query('DELETE FROM nonces WHERE expires < NOW()',
                (error, results, fields) => {
                    // Close the connection
                    connection.end();

                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve(true);
                });
        });
    }

};
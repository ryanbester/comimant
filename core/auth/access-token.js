/*
 * Copyright (C) 2019 - 2020 Comimant
 */

const crypto = require('crypto');
require('datejs');

const mysql = require('../../db/mysql');

/**
 * Class representing an access token.
 * @type {AccessToken}
 */
module.exports.AccessToken = class AccessToken {

    /**
     * Creates a new access token.
     * @param {string} user_id The user ID
     * @param {number} lifetime The lifetime of the access token in minutes.
     * @param {string} id The ID of the access token. Will be randomly generated if not provided.
     */
    constructor(user_id, lifetime = 525600, id= undefined) {
        this.user_id = user_id;
        this.lifetime = lifetime;

        if (this.lifetime !== undefined) {
            this.expiry = Date.today().setTimeToNow().addMinutes(this.lifetime);
        }

        if (id === undefined) {
            this.id = crypto.randomBytes(32).toString('hex');
        } else {
            this.id = id;
        }

        this.table = 'access_tokens';
    }

    /**
     * Saves the access token to the database.
     * @return {Promise<boolean>|Promise<Error>} True on success.
     */
    saveTokenToDatabase() {
        return new Promise((resolve, reject) => {
            // Check if the ID is already in the database
            const checkID = _ => {
                return new Promise((resolve, reject) => {
                    // Create a connection to the database
                    const connection = mysql.getConnection();

                    // Open the connection
                    connection.connect();

                    // Execute the query to check for the ID
                    connection.query(
                        'SELECT COUNT(*) AS IDCount FROM ' + this.table + ' WHERE access_token = UNHEX(' + connection.escape(
                        this.id) + ')',
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
                                this.id = crypto.randomBytes(32).toString('hex');
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
                // Convert expiry time to string
                let expiryDateTime = this.expiry.toString('u');

                // Remove the Z from the end of the timestamp
                expiryDateTime = expiryDateTime.slice(0, -1);

                // SHA-256 the access token
                const hash = crypto.createHash('sha256').update(this.id).digest('hex');

                // Create a connection to the database
                const connection = mysql.getConnection('modify');

                // Open the connection
                connection.connect();

                // Execute the query to insert the access token into the database
                connection.query('INSERT INTO ' + this.table + ' VALUES('
                    + 'UNHEX(' + connection.escape(hash) + '), '
                    + 'UNHEX(' + connection.escape(this.user_id) + '), '
                    + connection.escape(expiryDateTime) + ')',
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
        });
    }

    /**
     * Checks if the access token is valid.
     * @return {Promise<boolean>|Promise<Error>} True on success.
     */
    checkToken() {
        return new Promise((resolve, reject) => {
            // SHA-256 the access token
            const hash = crypto.createHash('sha256').update(this.id).digest('hex');

            // Create a connection to the database
            const connection = mysql.getConnection();

            // Open the connection
            connection.connect();

            // Check if the access token is in the database
            connection.query(
                'SELECT HEX(user_id) AS user_id, expires FROM ' + this.table + ' WHERE access_token = UNHEX(' + connection.escape(
                hash) + ')',
                (error, results) => {
                    // Close the connection
                    connection.end();

                    if (error) {
                        reject(error);
                        return;
                    }

                    // If access token is not found, return an error
                    if (results === undefined || results.length === 0) {
                        reject('Access token not found');
                    } else {
                        // If access token has expired, return an error
                        if (Date.parse(results[0].expires) < Date.today()) {
                            reject('Token has expired');
                        } else {
                            this.user_id = results[0].user_id;
                            resolve(true);
                        }
                    }
                });
        });
    }

    /**
     * Deletes the access token from the database.
     * @return {Promise<boolean>|Promise<Error>} True on success.
     */
    deleteToken() {
        return new Promise((resolve, reject) => {
            // SHA-256 the access token
            const hash = crypto.createHash('sha256').update(this.id).digest('hex');

            // Create a connection to the database
            const connection = mysql.getConnection();

            // Open the connection
            connection.connect();

            // Check if the access token exists
            connection.query(
                'SELECT * FROM ' + this.table + ' WHERE access_token = UNHEX(' + connection.escape(hash) + ')',
                (error, results) => {
                    // Close the connection
                    connection.end();

                    if (error) {
                        reject(error);
                        return;
                    }

                    if (results.length > 0) {
                        // Delete the access token

                        // Create a connection to the database
                        const connection = mysql.getConnection('delete');

                        // Open the connection
                        connection.connect();

                        // Execute the delete query
                        connection.query(
                            'DELETE FROM ' + this.table + ' WHERE access_token = UNHEX(' + connection.escape(
                            hash) + ')',
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
                });
        });
    }

    /**
     * Deletes all access tokens for a user.
     * @param {string[]} exceptions Access token IDs that will not be deleted.
     * @return {Promise<boolean>|Promise<Error>} True on success.
     */
    deleteUserTokens(exceptions) {
        return new Promise((resolve, reject) => {
            if (this.user_id === undefined) {
                reject('User ID not set');
                return;
            }

            let exceptionSubQuery = '';

            // Create a connection to the database
            const connection = mysql.getConnection('delete');

            if (exceptions !== undefined) {
                const hashedExceptions = [];

                // SHA-256 every exception
                exceptions.forEach((exception) => {
                    const hash = crypto.createHash('sha256').update(exception).digest('hex');

                    hashedExceptions.push(hash);
                });

                hashedExceptions.forEach((exception) => {
                    exceptionSubQuery += ' AND access_token != UNHEX(' + connection.escape(exception) + ')';
                });
            }

            // Open the connection
            connection.connect();

            connection.query('DELETE FROM ' + this.table + ' WHERE user_id = UNHEX(' + connection.escape(
                this.user_id) + ')' + exceptionSubQuery,
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
     * Deletes all expired access tokens from the database.
     * @param {string} table The table to use.
     * @return {Promise<boolean>|Promise<Error>} True on success.
     */
    static deleteExpiredTokens(table = 'access_tokens') {
        return new Promise((resolve, reject) => {
            // Create a connection to the database
            const connection = mysql.getConnection('delete');

            // Open the connection
            connection.connect();

            connection.query('DELETE FROM ' + table + ' WHERE expires < NOW()',
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
     * Deletes all access tokens.
     * @param {string} table The table to use.
     * @return {Promise<boolean>|Promise<Error>} True on success.
     */
    static deleteAllTokens(table = 'access_tokens') {
        return new Promise((resolve, reject) => {
            // Create a connection to the database
            const connection = mysql.getConnection('delete');

            // Open the connection
            connection.connect();

            connection.query('DELETE FROM ' + table,
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

};
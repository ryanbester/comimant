/*
 * Copyright (C) 2019 - 2020 Comimant
 */

const crypto = require('crypto');

const mysql = require('../../db/mysql');

/**
 * Class representing a User.
 * @type {User}
 */
module.exports.User = class User {

    /**
     * Creates a new instance of the User class.
     * @param {string} user_id The user ID.
     * @param {string} username The username.
     * @param {string} email_address The email address.
     * @param {string} first_name The first name.
     * @param {string} last_name The last name.
     * @param {Date} date_added The date joined.
     * @param {Date} dob The date of birth.
     * @param {string} image_url Path to the profile image.
     * @param {Object} privileges Privileges object.
     */
    constructor(user_id, username = undefined, email_address = undefined, first_name = undefined, last_name = undefined,
                date_added = undefined, dob = undefined, image_url = undefined, privileges = undefined) {
        this.user_id = user_id;
        this.username = username;
        this.email_address = email_address;
        this.first_name = first_name;
        this.last_name = last_name;
        this.date_added = date_added;
        this.dob = dob;
        this.image_url = image_url;
        this.privileges = privileges;
    }

    /**
     * Load the information for the user from the database
     * @return {Promise<boolean>|Promise<Error>} True on success.
     */
    loadInfo() {
        return new Promise((resolve, reject) => {
            // Check if user ID is set
            if (this.user_id === undefined) {
                reject('User ID not set');
                return;
            }

            // Create a connection to the database
            const connection = mysql.getConnection();

            // Open the connection
            connection.connect();

            // Execute the query to obtain the user details
            connection.query('SELECT username,' +
                ' CONVERT(AES_DECRYPT(email_address, UNHEX(' + connection.escape(
                    process.env.DATABASE_KEY) + ')) USING utf8) AS email_address,' +
                ' first_name, last_name, date_added, dob, image_url' +
                ' FROM users WHERE user_id = UNHEX(' + connection.escape(this.user_id) + ')',
                (error, results) => {
                    // Close the connection
                    connection.end();

                    if (error) {
                        reject(error);
                        return;
                    }

                    // If the user ID matches a record
                    if (results.length > 0) {
                        // Get the user details
                        this.username = results[0].username;
                        this.email_address = results[0].email_address;
                        this.first_name = results[0].first_name;
                        this.last_name = results[0].last_name;
                        this.date_added = new Date(results[0].date_added);
                        this.dob = new Date(results[0].dob);
                        this.image_url = results[0].image_url;

                        resolve(true);
                    } else {
                        reject('Cannot retrieve information for user');
                    }

                });
        });
    }

    /**
     * Check if the user is in the database.
     * @return {Promise<boolean>|Promise<Error>} True if the user is in the database.
     */
    verifyUser() {
        return new Promise((resolve, reject) => {
            // Create a connection to the database
            const connection = mysql.getConnection();

            // Open the connection
            connection.connect();

            // Execute the query to check for the user ID
            connection.query('SELECT COUNT(*) AS UserCount FROM users WHERE user_id = UNHEX(' + connection.escape(
                this.user_id) + ')',
                (error, results) => {
                    // Close the connection
                    connection.end();

                    if (error) {
                        reject(error);
                        return;
                    }

                    // If the user is in the database, return true
                    const { UserCount } = results[0];
                    if (UserCount > 0 && UserCount < 2) {
                        resolve(true);
                    } else {
                        reject('Cannot find user in database');
                    }
                });
        });
    }

    /**
     * Saves the user information to the database.
     * @return {Promise<boolean>|Promise<Error>} True on success.
     */
    saveUser() {
        return new Promise((resolve, reject) => {
            if (this.user_id === undefined) {
                reject('User ID not set');
                return;
            }

            // Create a connection to the database
            const connection = mysql.getConnection('modify');

            // Open the connection
            connection.connect();

            connection.query('SELECT COUNT(*) AS UserCount FROM users WHERE user_id = UNHEX(' + connection.escape(
                this.user_id) + ')',
                (error, results) => {
                    // Update the existing user
                    // Prepare date joined and dob
                    let date_added = this.date_added.getFullYear() + '-' + ('0' + (this.date_added.getMonth() + 1)).slice(
                        -2) + '-' + ('0' + this.date_added.getDate()).slice(-2);
                    let dob = this.dob.getFullYear() + '-' + ('0' + (this.dob.getMonth() + 1)).slice(
                        -2) + '-' + ('0' + this.dob.getDate()).slice(-2);

                    if (error) {
                        connection.end();
                        reject(error);
                    } else {
                        const { UserCount } = results[0];
                        if (UserCount > 0) {
                            // Execute the query to update the user information
                            connection.query('UPDATE users '
                                + 'SET username = ' + connection.escape(this.username) + ', '
                                + 'email_address = AES_ENCRYPT(' + connection.escape(
                                    this.email_address) + ', UNHEX(' + connection.escape(
                                    process.env.DATABASE_KEY) + ')), '
                                + 'first_name = ' + connection.escape(this.first_name) + ', '
                                + 'last_name = ' + connection.escape(this.last_name) + ', '
                                + 'date_added = ' + connection.escape(date_added) + ', '
                                + 'dob = ' + connection.escape(dob) + ', '
                                + 'image_url = ' + connection.escape(this.image_url)
                                + ' WHERE user_id = UNHEX(' + connection.escape(this.user_id) + ')',
                                (error) => {
                                    // Close the connection
                                    connection.end();

                                    if (error) {
                                        reject(error);
                                        return;
                                    }

                                    resolve(true);
                                });
                        } else {
                            // Execute the query to update the user information
                            connection.query('INSERT INTO users VALUES('
                                + 'UNHEX(' + connection.escape(this.user_id) + '), '
                                + connection.escape(this.username) + ', '
                                + 'AES_ENCRYPT(' + connection.escape(
                                    this.email_address) + ', UNHEX(' + connection.escape(
                                    process.env.DATABASE_KEY) + ')), '
                                + connection.escape(this.first_name) + ', '
                                + connection.escape(this.last_name) + ', '
                                + connection.escape(date_added) + ', '
                                + connection.escape(dob) + ', '
                                + connection.escape(this.image_url) + ')',
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
                });
        });
    }

    /**
     * Deletes the user from the database.
     * @return {Promise<boolean>|Promise<Error>} True on success.
     */
    deleteUser() {
        return new Promise((resolve, reject) => {
            if (this.user_id === undefined) {
                reject('User ID not set');
                return;
            }

            // Create a connection to the database
            const connection = mysql.getConnection('delete');

            // Open the connection
            connection.connect();

            connection.query('DELETE FROM users WHERE user_id = UNHEX(' + connection.escape(this.user_id) + ')',
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
     * Checks if the username is already in the database.
     * @param {string} username The username to search for.
     * @return {Promise<boolean>|Promise<Error>} True if the username is taken or false if it is available.
     */
    static usernameTaken(username) {
        return new Promise((resolve, reject) => {
            // Create a connection to the database
            const connection = mysql.getConnection();

            // Open the connection
            connection.connect();

            // Execute the query to check for the username
            connection.query('SELECT COUNT(*) AS UserCount FROM users WHERE username = ' + connection.escape(username),
                (error, results) => {
                    // Close the connection
                    connection.end();

                    if (error) {
                        reject(error);
                        return;
                    }

                    // If the username is in the database, return true
                    const { UserCount } = results[0];
                    if (UserCount > 0) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                });
        });
    }

    /**
     * Generates a new unique random user ID.
     * @return {Promise<string>} The user ID.
     */
    static generateUserId() {
        return new Promise((resolve) => {
            let id = crypto.randomBytes(16).toString('hex');

            // Check if the ID is already in the database
            const checkID = _ => {
                return new Promise((resolve, reject) => {
                    // Create a connection to the database
                    const connection = mysql.getConnection();

                    // Open the connection
                    connection.connect();

                    // Execute the query to check for the ID
                    connection.query(
                        'SELECT COUNT(*) AS IDCount FROM users WHERE user_id = UNHEX(' + connection.escape(id) + ')',
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
                                id = crypto.randomBytes(16).toString('hex');
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
                resolve(id);
            });
        });
    }

    // TODO: Add privileges code

};
/*
 * Copyright (C) 2019 - 2020 Comimant
 */

const argon2 = require('argon2');
const crypto = require('crypto');

const mysql = require('../../db/mysql');
const { User } = require('./user');

/**
 * Class containing methods for Authorizing users.
 * @type {Auth}
 */
module.exports.Auth = class Auth {

    /**
     * Encrypts a password.
     * @param {string} password The password to encrypt.
     * @return {Promise<Object>|Promise<Error>} Returns an object containing the hash, encrypted salt, salt IV, or the
     *     error on failure.
     */
    static encryptPassword(password) {
        return new Promise((resolve, reject) => {
            // Generate the salt
            const salt = crypto.randomBytes(8).toString('hex');

            // Concatenate the password, salt, and pepper
            const passwordCombined = password + salt + process.env.PEPPER;

            // Generate the first hash (SHA-512 HMAC of salt and peppered password)
            const hash1 = crypto.createHmac('sha512', process.env.SECRET_1).update(passwordCombined).digest('hex');

            // Generate the second hash (SHA-256 HMAC of plain password)
            const hash2 = crypto.createHmac('sha256', process.env.SECRET_2).update(password).digest('base64')
                .substr(0, 32);

            // Generate the initialization vector
            let iv = crypto.randomBytes(16);

            // Check if the IV is in the database
            const checkIV = _ => {
                return new Promise((resolve, reject) => {
                    // Create a connection to the database
                    const connection = mysql.getConnection();

                    // Open the connection
                    connection.connect();

                    // Execute the query to check for the IV
                    connection.query(
                        'SELECT COUNT(*) AS IVCount FROM passwd WHERE salt_iv = UNHEX(' + connection.escape(
                        iv.toString('hex')) + ')',
                        (error, results) => {
                            // Close the connection
                            connection.end();

                            if (error) {
                                reject(error);
                                return;
                            }

                            // If the IV is in the database, generate a new IV and continue the loop
                            const { IVCount } = results[0];
                            if (IVCount > 0) {
                                iv = crypto.randomBytes(16);
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
                    // If IV is not in database, end the loop
                    return condition(data) ? action(data).then(whilst) : Promise.resolve(data);
                };
                return whilst(data);
            })(true, ivFound => ivFound, checkIV).then(_ => {
                // Encrypt the salt with the SHA-256'd password with AES-256-CBC
                const cipher = crypto.createCipheriv('aes-256-cbc', hash2, iv);
                const saltEncrypted = cipher.update(salt, 'utf8', 'hex') + cipher.final('hex');

                // Hash the first hash with Argon2
                argon2.hash(hash1, { type: argon2.argon2id, timeCost: 8, parallelism: 8 })
                    .then(hash => {
                        // Return the hashed password, encrypted salt, and salt IV
                        resolve([hash, saltEncrypted, iv]);
                    }, err => {
                        reject(err);
                    });
            });
        });
    }

    /**
     * Verifies a password.
     * @param {string} password The password to verify.
     * @param {Object} options Contains hash, encrypted salt, salt IV and user ID.
     * @return {Promise<User>|Promise<Error>} The User on success.
     */
    static verifyPassword(password, options) {
        return new Promise((resolve, reject) => {
            const verifyPassword = (hash, saltEncrypted, iv) => {
                return new Promise((resolve, reject) => {
                    try {
                        // Generate the  second hash (SHA-256 HMAC of plain password)
                        const hash2 = crypto.createHmac('sha256', process.env.SECRET_2).update(password)
                            .digest('base64').substr(0, 32);

                        // Decrypt the salt with the SHA-256'd password with AES-256-CBC
                        const cipher = crypto.createDecipheriv('aes-256-cbc', hash2, iv);
                        const salt = cipher.update(saltEncrypted, 'hex', 'utf8') + cipher.final('utf8');

                        // Concatenate the password, salt, and pepper
                        const passwordCombined = password + salt + process.env.PEPPER;

                        // Generate the first hash (SHA-512 HMAC of salt and peppered password)
                        const hash1 = crypto.createHmac('sha512', process.env.SECRET_1).update(passwordCombined)
                            .digest('hex');

                        // Verify the first hash with Argon2
                        argon2.verify(hash, hash1).then(result => {
                            // Return the result
                            resolve(result);
                        }, err => {
                            reject(err);
                        });
                    } catch (ex) {
                        reject(ex);
                    }
                });
            };

            if (options['all']) {
                // Declare the variables in the order returned from the encryptPassword function
                if (options['all'][0] === undefined) {
                    reject('Hash is not set');
                    return;
                }
                const hash = options['all'][0];

                if (options['all'][1] === undefined) {
                    reject('Encrypted salt is not set');
                    return;
                }
                const saltEncrypted = options['all'][1];

                if (options['all'][2] === undefined) {
                    reject('Salt IV is not set');
                    return;
                }
                const iv = options['all'][2];

                if (options['all'][3] === undefined) {
                    reject('User ID is not set');
                    return;
                }
                const user_id = options['all'][3];

                // Verify the password
                verifyPassword(hash, saltEncrypted, iv, user_id).then(result => {
                    if (result) {
                        resolve(new User(user_id));
                    } else {
                        reject('Password verification failed');
                    }
                }, err => {
                    reject(err);
                });
            } else {
                // Declare the variables
                if (options['hash'] === undefined) {
                    reject('Hash is not set');
                    return;
                }
                const hash = options['hash'];

                if (options['saltEncrypted'] === undefined) {
                    reject('Salt is not set');
                    return;
                }
                const saltEncrypted = options['saltEncrypted'];

                if (options['iv'] === undefined) {
                    reject('Salt IV is not set');
                    return;
                }
                const iv = options['iv'];

                if (options['user_id'] === undefined) {
                    reject('User ID is not set');
                    return;
                }
                const user_id = options['user_id'];

                // Verify the password
                verifyPassword(hash, saltEncrypted, iv, user_id).then(result => {
                    if (result) {
                        resolve(new User(user_id));
                    } else {
                        reject('Password verification failed');
                    }
                }, err => {
                    reject(err);
                });
            }
        });
    }

    /**
     * Reads the encrypted password from the database for the user.
     * @param {string} email The user's email address.
     * @return {Promise<Object>|Promise<Error>} Object containing the hash, encrypted salt, salt IV, and user ID.
     */
    static readPasswordFromDatabase(email) {
        return new Promise((resolve, reject) => {
            const getPassword = (connection, user_id) => {
                return new Promise((resolve, reject) => {
                    // Query the passwd table for the password, salt, and IV with the user ID
                    connection.query(
                        'SELECT password, HEX(salt) AS salt, HEX(salt_iv) AS salt_iv FROM passwd WHERE user_id = UNHEX(' + connection.escape(
                        user_id) + ')',
                        (error, results) => {
                            // Close the connection
                            connection.end();

                            if (error) {
                                reject(error);
                                return;
                            }

                            // If the user ID matches a record
                            if (results.length > 0) {
                                // Get the password, salt, and IV
                                const { password, salt: salt1, salt_iv: salt_iv1 } = results[0];

                                // Return the password, salt, and IV
                                resolve([password, salt1, Buffer.from(salt_iv1, 'hex'), user_id]);
                            } else {
                                reject('Email address or password is incorrect');
                            }
                        });
                });
            };

            // Create a connection to the database
            const connection = mysql.getConnection();

            // Open the connection
            connection.connect();

            // Execute the query to get the record with the email address
            connection.query(
                'SELECT HEX(user_id) AS user_id FROM users WHERE email_address = AES_ENCRYPT(' + connection.escape(
                email) + ', UNHEX(' + connection.escape(process.env.DATABASE_KEY) + '))',
                (error, results) => {
                    if (error) {
                        // Close the connection
                        connection.end();

                        reject(error);
                        return;
                    }

                    // If the email address matches a record
                    if (results.length > 0) {
                        // Get the user ID
                        const user_id = results[0].user_id;
                        getPassword(connection, user_id).then(result => {
                            if (result) {
                                resolve(result);
                            } else {
                                reject('Cannot retrieve encrypted password from database');
                            }
                        }, err => {
                            reject(err);
                        });
                    } else {
                        // Close the connection
                        connection.end();

                        reject('Email address or password is incorrect');
                    }
                });
        });
    }

    /**
     * Saves the encrypted password to the database.
     * @param {Object} options Contaings the encrypted password, encrypted salt, salt IV, and user ID.
     * @return {Promise<boolean>|Promise<Error>} True on success.
     */
    static savePasswordToDatabase(options) {
        return new Promise((resolve, reject) => {
            const savePassword = (hash, saltEncrypted, iv, user_id) => {
                return new Promise((resolve, reject) => {
                    // Create a connection to the database
                    const connection = mysql.getConnection('modify');

                    // Open the connection
                    connection.connect();

                    connection.query(
                        'SELECT COUNT(*) AS UserCount FROM passwd WHERE user_id = UNHEX(' + connection.escape(
                        user_id) + ')',
                        (error, results) => {
                            if (error) {
                                connection.end();
                                reject(error);
                                return;
                            } else {
                                const { UserCount } = results[0];
                                if (UserCount > 0) {
                                    // Execute the query to update the existing password in the database
                                    connection.query('UPDATE passwd '
                                        + 'SET password = ' + connection.escape(hash) + ', '
                                        + 'salt = UNHEX(' + connection.escape(saltEncrypted) + '), '
                                        + 'salt_iv = UNHEX(' + connection.escape(iv.toString('hex')) + ') '
                                        + 'WHERE user_id = UNHEX(' + connection.escape(user_id) + ')',
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
                                    // Execute the query to insert the new password into the database
                                    connection.query('INSERT INTO passwd VALUES('
                                        + 'UNHEX(' + connection.escape(user_id) + '), '
                                        + connection.escape(hash) + ', '
                                        + 'UNHEX(' + connection.escape(saltEncrypted) + '), '
                                        + 'UNHEX(' + connection.escape(iv.toString('hex')) + '))',
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
            };
            if (options['all']) {
                // Declare the variables in the order returned from the encryptPassword function
                if (options['all'][0] === undefined) {
                    reject('Hash is not set');
                    return;
                }
                const hash = options['all'][0];

                if (options['all'][1] === undefined) {
                    reject('Encrypted salt is not set');
                    return;
                }
                const saltEncrypted = options['all'][1];

                if (options['all'][2] === undefined) {
                    reject('Salt IV is not set');
                    return;
                }
                const iv = options['all'][2];

                if (options['all'][3] === undefined) {
                    reject('User ID is not set');
                    return;
                }
                const user_id = options['all'][3];

                // Verify the password
                savePassword(hash, saltEncrypted, iv, user_id).then(result => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject('Cannot save password to database');
                    }
                }, err => {
                    reject(err);
                });
            } else {
                // Declare the variables
                if (options['hash'] === undefined) {
                    reject('Hash is not set');
                    return;
                }
                const hash = options['hash'];

                if (options['saltEncrypted'] === undefined) {
                    reject('Salt is not set');
                    return;
                }
                const saltEncrypted = options['saltEncrypted'];

                if (options['iv'] === undefined) {
                    reject('Salt IV is not set');
                    return;
                }
                const iv = options['iv'];

                if (options['user_id'] === undefined) {
                    reject('User ID is not set');
                    return;
                }
                const user_id = options['user_id'];

                // Verify the password
                savePassword(hash, saltEncrypted, iv, user_id).then(result => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject('Cannot save password to database');
                    }
                }, err => {
                    reject(err);
                });
            }

        });
    }

    /**
     * Deletes a encrypted password from the database.
     * @param {string} user_id The user ID to delete the password for.
     * @return {Promise<boolean>|Promise<Error>} True on success.
     */
    static deletePasswordFromDatabase(user_id) {
        return new Promise((resolve, reject) => {
            // Create a connection to the database
            const connection = mysql.getConnection('delete');

            // Open the connection
            connection.connect();

            connection.query('DELETE FROM passwd WHERE user_id = UNHEX(' + connection.escape(user_id) + ')',
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
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

const mysql = require('../../db/mysql');
const { User } = require('./user');

/**
 * Utility class for authorization.
 * @type {AuthUtil}
 */
module.exports.AuthUtil = class AuthUtil {

    /**
     * Counts the users in the database.
     * @return {Promise<Number>|Promise<Error>} The number of users.
     */
    static countUsers() {
        return new Promise((resolve, reject) => {
            const connection = mysql.getConnection();

            // Open the connection
            connection.connect();

            connection.query(
                'SELECT COUNT(*) AS UserCount FROM users',
                (error, results) => {
                    // Close the connection
                    connection.end();

                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve(results[0].UserCount);
                });
        });
    }

    /**
     * Gets all the users in the database.
     * @return {Promise<User[]>|Promise<Error>} An array of users.
     */
    static getUsers(viewOptions) {
        return new Promise((resolve, reject) => {
            const connection = mysql.getConnection();

            // Open the connection
            connection.connect();

            let query = 'SELECT HEX(user_id) AS user_id, username,' +
                ' CONVERT(AES_DECRYPT(email_address, UNHEX(' + connection.escape(
                    process.env.DATABASE_KEY) + ')) USING utf8) AS email_address,' +
                ' first_name, last_name, date_added, dob, image_url, locked FROM users';

            if (viewOptions.filterTerm !== undefined) {
                if (viewOptions.filterColumn !== undefined) {
                    query += ' WHERE ' + connection.escapeId(viewOptions.filterColumn);

                    if (viewOptions.filterMode !== undefined) {
                        switch (viewOptions.filterMode) {
                            case 'contains':
                                query += ' LIKE ' + connection.escape('%' + viewOptions.filterTerm + '%');
                                break;
                            case 'begins_with':
                                query += ' LIKE ' + connection.escape(viewOptions.filterTerm + '%');
                                break;
                            case 'ends_with':
                                query += ' LIKE ' + connection.escape('%' + viewOptions.filterTerm);
                                break;
                            case 'equal':
                                query += ' = ' + connection.escape(viewOptions.filterTerm);
                                break;
                        }
                    } else {
                        query += ' LIKE ' + connection.escape('%' + viewOptions.filterTerm + '%');
                    }
                }
            }

            if (viewOptions.sortColumn !== undefined) {
                query += ' ORDER BY ' + connection.escapeId(viewOptions.sortColumn);

                if (viewOptions.sortMode !== undefined) {
                    query += ' ' + (viewOptions === 'desc' ? 'DESC' : 'ASC');
                }
            }

            query += ' LIMIT ' + connection.escape(
                Number.parseInt(viewOptions.perPage)) + ' OFFSET ' + connection.escape(
                Number.parseInt(viewOptions.offset));

            connection.query(query,
                (error, results) => {
                    // Close the connection
                    connection.end();
                    if (error) {
                        reject(error);
                        return;
                    }

                    let users = [];

                    Object.keys(results).forEach(key => {
                        users.push(new User(
                            results[key].user_id,
                            results[key].username,
                            results[key].email_address,
                            results[key].first_name,
                            results[key].last_name,
                            new Date(results[key].date_added),
                            new Date(results[key].dob),
                            results[key].image_url,
                            results[key].locked === 1
                        ));
                    });

                    resolve(users);
                });
        });
    }

};

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

const mysql = require('../../db/mysql');

/**
 * Class representing a widget.
 * @type {Widget}
 */
module.exports.Widget = class Widget {
    /**
     * Creates a new instance of the Widget class.
     * @param widget_id The widget ID.
     * @param user_id The user ID.
     * @param type The widget type.
     * @param title The widget title.
     * @param data The JSON data of the widget.
     */
    constructor(widget_id, user_id, type, title, data) {
        this.widget_id = widget_id;
        this.user_id = user_id;
        this.type = type;
        this.title = title;
        this.data = data;
    }

    /**
     * Load the information for the widget from the database
     * @return {Promise<boolean>|Promise<Error>} True on success.
     */
    loadInfo() {
        return new Promise((resolve, reject) => {
            // Check if user ID is set
            if (this.user_id === undefined) {
                reject('Widget ID not set');
                return;
            }

            // Create a connection to the database
            const connection = mysql.getConnection();

            // Open the connection
            connection.connect();

            // Execute the query to obtain the widget details
            connection.query('SELECT HEX(user_id) AS user_id, type, title, data FROM widgets WHERE widget_id = UNHEX('
                + connection.escape(this.widget_id) + ')',
                (error, results) => {
                    // Close the connection
                    connection.end();

                    if (error) {
                        reject(error);
                        return;
                    }

                    // If the widget ID matches a record
                    if (results.length > 0) {
                        // Get the widget details
                        this.user_id = results[0].user_id;
                        this.type = results[0].type;
                        this.title = results[0].title;
                        this.data = JSON.parse(results[0].data);

                        resolve(true);
                    } else {
                        reject('Cannot retrieve information for widget');
                    }

                });
        });
    }

    /**
     * Saves the widget information to the database.
     * @return {Promise<boolean>|Promise<Error>} True on success.
     */
    saveWidget() {
        return new Promise((resolve, reject) => {
            if (this.widget_id === undefined) {
                reject('Widget ID not set');
                return;
            }

            // Create a connection to the database
            const connection = mysql.getConnection('modify');

            // Open the connection
            connection.connect();

            connection.query('SELECT COUNT(*) AS WidgetCount FROM widgets WHERE widget_id = UNHEX('
                + connection.escape(this.widget_id) + ')',
                (error, results) => {
                    // Update the existing widget
                    if (error) {
                        connection.end();
                        reject(error);
                    } else {
                        const { WidgetCount } = results[0];
                        if (WidgetCount > 0) {
                            // Execute the query to update the widget information
                            connection.query('UPDATE widgets '
                                + 'SET user_id = UNHEX(' + connection.escape(this.user_id) + '), '
                                + 'type = ' + connection.escape(this.type) + ', '
                                + 'title = ' + connection.escape(this.title) + ', '
                                + 'data = ' + connection.escape(JSON.stringify(this.data))
                                + ' WHERE widget_id = UNHEX(' + connection.escape(this.widget_id) + ')',
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
                            // Execute the query add a new widget
                            connection.query('INSERT INTO widgets VALUES('
                                + 'UNHEX(' + connection.escape(this.widget_id) + '), '
                                + 'UNHEX(' + connection.escape(this.user_id) + '), '
                                + connection.escape(this.type) + ', '
                                + connection.escape(this.title) + ', '
                                + connection.escape(JSON.stringify(this.data)) + ')',
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
     * Deletes the widget from the database.
     * @return {Promise<boolean>|Promise<Error>} True on success.
     */
    deleteWidget() {
        return new Promise((resolve, reject) => {
            if (this.widget_id === undefined) {
                reject('Widget ID not set');
                return;
            }

            // Create a connection to the database
            const connection = mysql.getConnection('delete');

            // Open the connection
            connection.connect();

            connection.query('DELETE FROM widgets WHERE widget_id = UNHEX(' + connection.escape(this.widget_id) + ')',
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
     * Generates a new unique random widget ID.
     * @return {Promise<string>} The widget ID.
     */
    static generateWidgetId() {
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
                        'SELECT COUNT(*) AS IDCount FROM widgets WHERE widget_id = UNHEX(' + connection.escape(id) + ')',
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
};

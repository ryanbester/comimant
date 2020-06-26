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

/**
 * Class representing a privilege template.
 * @type {PrivilegeTemplate}
 */
module.exports.PrivilegeTemplate = class PrivilegeTemplate {

    /**
     * Creates a new Privilege Template object.
     * @param {string} name The name.
     * @param {string} title The title.
     * @param {object} privileges The privileges.
     * @param {boolean} defaultTemplate Whether it is the default template or not.
     */
    constructor(name, title = undefined, privileges = undefined, defaultTemplate = undefined) {
        this.name = name;
        this.title = title;
        this.privileges = privileges;
        this.defaultTemplate = defaultTemplate;
    }

    /**
     * Loads the privilege template information from the database.
     * @return {Promise<boolean>|Promise<Error>} True on success.
     */
    loadInfo() {
        return new Promise((resolve, reject) => {
            if (this.name === undefined) {
                reject('Privilege template name is not set');
                return;
            }

            // Create a connection to the database
            const connection = mysql.getConnection();

            // Open the connection
            connection.connect();

            connection.query(
                'SELECT * FROM privilege_templates WHERE name = ' + connection.escape(
                this.name),
                (error, results) => {
                    // Close the connection
                    connection.end();

                    if (error) {
                        reject(error);
                        return;
                    }

                    if (results.length > 0) {
                        this.title = results[0].title;
                        this.privileges = JSON.parse(results[0].privileges);
                        this.defaultTemplate = results[0].default_template === 1;

                        resolve(true);
                    } else {
                        reject('Cannot retrieve privilege template information');
                    }
                });
        });
    }

    /**
     * Saves the privilege template to the database.
     * @param {string} originalName The original name of the template. This is used when renaming the template.
     * @return {Promise<boolean>|Promise<Error>} True on success.
     */
    savePrivilegeTemplate(originalName) {
        return new Promise((resolve, reject) => {
            if (this.name === undefined) {
                reject('Privilege template name is not set');
                return;
            }

            let name = this.name;

            if (originalName !== undefined) {
                name = originalName;
            }

            // Create a connection to the database
            const connection = mysql.getConnection('modify');

            // Open the connection
            connection.connect();

            connection.query(
                'SELECT COUNT(*) AS Count FROM privilege_templates WHERE name = ' + connection.escape(name) + ')',
                (error, results) => {
                    if (error) {
                        connection.end();
                        reject(error);
                        return;
                    }

                    const { Count } = results[0];
                    if (Count > 0) {
                        connection.query('UPDATE privilege_templates '
                            + 'SET name = ' + connection.escape(this.name) + ', '
                            + 'title = ' + connection.escape(this.title) + ', '
                            + 'privileges = ' + connection.escape(JSON.stringify(this.privileges)) + ', '
                            + 'default_template = ' + connection.escape(this.defaultTemplate === true ? 1 : 0)
                            + ' WHERE name = ' + connection.escape(name),
                            (error) => {
                                connection.end();

                                if (error) {
                                    reject(error);
                                    return;
                                }

                                resolve(true);
                            });
                    } else {
                        connection.query('INSERT INTO privilege_templates VALUES('
                            + connection.escape(this.name) + ', '
                            + connection.escape(this.title) + ', '
                            + connection.escape(JSON.stringify(this.privileges)) + ', '
                            + connection.escape(this.defaultTemplate === true ? 1 : 0) + ')',
                            (error) => {
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
     * Deletes the privilege template from the database.
     * @return {Promise<boolean>|Promise<Error>} True on success.
     */
    deletePrivilegeTemplate() {
        return new Promise((resolve, reject) => {
            if (this.name === undefined) {
                reject('Privilege template name is not set');
                return;
            }

            // Create a connection to the database
            const connection = mysql.getConnection('delete');

            // Open the connection
            connection.connect();

            connection.query('DELETE FROM privilege_templates WHERE name = ' + connection.escape(this.name),
                (error) => {
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
     * Checks whether the privilege template contains the privilege or not.
     * @param {string} name The privilege name.
     * @return {boolean} True if the privilege is granted or false otherwise.
     */
    hasPrivilege(name) {
        if (this.name === undefined) {
            return false;
        }

        if (this.privileges === undefined) {
            return false;
        }

        if (this.privileges.hasOwnProperty(name)) {
            if (this.privileges[name] === 1) {
                return true;
            }
        }

        return false;
    }

    /**
     * Adds a privilege to the privilege template.
     * @param {string} name The privilege name.
     * @param {boolean} granted Whether the privilege is granted or not.
     * @return {boolean} True if the method succeeds or false on failure.
     */
    addPrivilege(name, granted = true) {
        if (this.name === undefined) {
            return false;
        }

        if (this.privileges === undefined) {
            return false;
        }

        this.privileges[name] = granted === true ? 1 : 0;

        return true;
    }

    /**
     * Deletes a privilege from the privilege template.
     * @param {string} name The privilege name.
     * @return {boolean} True on success or false on failure.
     */
    deletePrivilege(name) {
        if (this.name === undefined) {
            return false;
        }

        if (this.privileges === undefined) {
            return false;
        }

        delete this.privileges[name];

        return true;
    }

    /**
     * Revokes a privilege from the privilege template.
     * @param {string} name The privilege name.
     * @return {boolean} True on success or false on failure.
     */
    revokePrivilege(name) {
        if (this.name === undefined) {
            return false;
        }

        if (this.privileges === undefined) {
            return false;
        }

        if (this.privileges.hasOwnProperty(name)) {
            this.privileges[name] = 0;
            return true;
        }

        return false;
    }

    /**
     * Gets the privileges in the privilege template
     * @return {Object|boolean} An object containing the privileges or false on failure.
     */
    getPrivileges() {
        if (this.name === undefined) {
            return false;
        }

        if (this.privileges === undefined) {
            return false;
        }

        return this.privileges;
    }

    /**
     * Counts the granted privileges in the privilege template.
     * @return {number|boolean} The number of privileges granted or false on failure.
     */
    countGrantedPrivileges() {
        if (this.name === undefined) {
            return false;
        }

        if (this.privileges === undefined) {
            return false;
        }

        let count = 0;
        Object.keys(this.privileges).forEach(name => {
            if (this.privileges[name] === 1) {
                count++;
            }
        });

        return count;
    }

};
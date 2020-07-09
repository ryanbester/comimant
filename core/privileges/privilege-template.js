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

const { Privileges } = require('../privileges/privileges');

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
     * Loads the privileges from the database into a Privileges object. This will not reload privileges if they've
     * already been loaded.
     * @return {Promise<boolean>|Promise<Error>} True on success.
     */
    loadPrivileges() {
        return new Promise((resolve, reject) => {
            // Check if privilege template name is set
            if (this.name === undefined) {
                reject('Name not set');
                return;
            }

            this.privileges = Privileges.getInstance(this);

            // Skip if they've already been loaded. In this case reload must be called.
            if (typeof this.privileges.privileges === 'object') {
                if (Object.keys(this.privileges.privileges).length > 0) {
                    resolve(true);
                    return;
                }
            }

            this.reloadPrivileges().then(result => resolve(result), err => reject(err));
        });
    }

    /**
     * Loads the privileges from the database into a Privileges object.
     * @return {Promise<boolean>|Promise<Error>} True on success.
     */
    reloadPrivileges() {
        return new Promise((resolve, reject) => {
            // Check if privilege template name is set
            if (this.name === undefined) {
                reject('Name not set');
                return;
            }

            this.privileges = Privileges.getInstance(this);
            this.privileges.privileges = {};

            const connection = mysql.getConnection();
            connection.connect();

            connection.query('SELECT privileges FROM privilege_templates ' +
                'WHERE name = ' + connection.escape(this.name),
                (error, results) => {
                    connection.end();

                    if (error) {
                        reject(error);
                        return;
                    }

                    let privilegesJson = JSON.parse(results[0].privileges);
                    for (const [name, granted] of Object.entries(privilegesJson)) {
                        privilegesJson[name] = (granted === 1);
                    }

                    this.privileges.parsePrivileges(privilegesJson);
                    resolve(true);
                });
        });
    }

};

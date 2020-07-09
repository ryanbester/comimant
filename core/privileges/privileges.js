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
 * Class containing methods for modifying privileges.
 * @type {Privileges}
 */
module.exports.Privileges = class Privileges {

    /**
     * Creates a new Privilege object.
     * @param {User|PrivilegeTemplate} target The user or privilege template.
     */
    constructor(target) {
        const { User } = require('../auth/user');
        const { PrivilegeTemplate } = require('../privileges/privilege-template');

        if (target instanceof User) {
            this.user_id = target.user_id;
        } else if (target instanceof PrivilegeTemplate) {
            this.pt_name = target.name;
        }
    }

    /**
     * Gets the current instance of the Privileges object for the user or privilege template.
     * @return {Privileges} The privileges object.
     */
    static getInstance(target) {
        if (typeof Privileges.instances !== 'object') {
            Privileges.instances = {};
        }

        const { User } = require('../auth/user');
        const { PrivilegeTemplate } = require('../privileges/privilege-template');

        let type, selector;
        if (target instanceof User) {
            type = 'users';
            selector = target.user_id;
        } else if (target instanceof PrivilegeTemplate) {
            type = 'pt';
            selector = target.name;
        }

        if (typeof Privileges.instances[type] !== 'object') {
            Privileges.instances[type] = {};
        }

        if (Privileges.instances[type][selector] === undefined) {
            Privileges.instances[type][selector] = new Privileges(target);
        }

        return Privileges.instances[type][selector];
    }

    /**
     * Parses an object of privileges to the optimised tree format.
     * @param {object} privileges The privileges object.
     */
    parsePrivileges(privileges) {
        if (privileges === undefined) {
            return false;
        }

        if (typeof privileges !== 'object') {
            return false;
        }

        this.privileges = {};
        for (const [name, granted] of Object.entries(privileges)) {
            const parts = name.split('.');
            const finalPart = parts.pop();

            let lastObj = this.privileges;
            for (const part of parts) {
                if (typeof lastObj[part] !== 'object') {
                    lastObj[part] = {};
                }

                lastObj = lastObj[part];
            }

            if (typeof granted === 'boolean') {
                lastObj[finalPart] = granted;
            } else {
                lastObj[finalPart] = (granted === 1);
            }
        }

        return true;
    }

    /**
     * Returns the privileges object.
     * @returns {object} The privileges.
     */
    getAllPrivileges() {
        if (typeof this.privileges !== 'object') {
            return {};
        }

        return this.privileges;
    }

    /**
     * Gets all the privileges as a flattened object.
     * @returns {{}} The privileges.
     */
    getAllPrivilegesFlat() {
        if (typeof this.privileges !== 'object') {
            return {};
        }

        const flatten = obj => {
            let arr = {};

            for (let i in obj) {
                if ((typeof obj[i]) == 'object') {
                    const flatObj = flatten(obj[i]);
                    for (let j in flatObj) {
                        arr[i + '.' + j] = flatObj[j];
                    }
                } else {
                    arr[i] = obj[i];
                }
            }

            return arr;
        };

        return flatten(this.privileges);
    }


    /**
     * Checks if the user or privilege template is granted the privilege.
     * @param {string} name The privilege name.
     */
    hasPrivilege(name) {
        if (typeof this.privileges !== 'object') {
            return true;
        }

        // Split name into individual parts
        const parts = name.split('.');
        // Store the last part and remove it from the array
        const finalPart = parts.pop();

        // Store the last object
        let lastObj = this.privileges;

        let granted = false;
        let explicitlyRevoked = false;
        let wildcardHit = false;

        // Check if each part is in the privileges object.
        for (const part of parts) {
            // Check for wildcard first
            if (lastObj['*'] === true) {
                wildcardHit = true;
            }

            if (typeof lastObj[part] === 'object') {
                lastObj = lastObj[part];
            } else {
                break;
            }
        }

        // Check if the final part is revoked
        if (lastObj[finalPart] === false) {
            explicitlyRevoked = true;
        }

        // Check if the final part is granted
        if (lastObj[finalPart] === true) {
            return true;
        }

        if (lastObj['*'] === true) {
            wildcardHit = true;
        }

        if (explicitlyRevoked) {
            return false;
        }

        if (wildcardHit) {
            return true;
        }

        return granted;
    }

    /**
     * Sets the granted state of a privilege. This method will add the privilege to the database if it does not already
     * exist.
     * @param {string} name The privilege name.
     * @param {boolean} granted Whether the privilege is granted or not.
     * @returns {Promise<boolean>|Promise<Error>} True on success.
     */
    setPrivilege(name, granted) {
        return new Promise((resolve, reject) => {
            if (typeof this.privileges !== 'object') {
                resolve('Privileges is not an object');
                return;
            }

            const parts = name.split('.');
            const finalPart = parts.pop();

            let lastObj = this.privileges;
            for (const part of parts) {
                if (typeof lastObj[part] !== 'object') {
                    lastObj[part] = {};
                }

                lastObj = lastObj[part];
            }

            lastObj[finalPart] = granted;

            // Save to database
            if (this.user_id !== undefined) {
                this.saveUserPrivilege(name, granted).then(result => resolve(result), err => reject(err));
            } else if (this.pt_name !== undefined) {
                this.savePTPrivilege(name, granted).then(result => resolve(result), err => reject(err));
            } else {
                reject('User ID or privilege template name not set');
            }
        });
    }

    /**
     * Deletes a privilege from the user or privilege template. For revoking a privilege, use `setPrivilege()`, setting
     * the second parameter to false.
     * @param {string} name The privilege name.
     * @returns {Promise<boolean>|Promise<Error>} True on success.
     */
    deletePrivilege(name) {
        return new Promise((resolve, reject) => {
            if (typeof this.privileges !== 'object') {
                resolve('Privileges is not an object');
                return;
            }

            const parts = name.split('.');
            const finalPart = parts.pop();

            let lastObj = this.privileges;
            for (const part of parts) {
                if (typeof lastObj[part] !== 'object') {
                    lastObj[part] = {};
                }

                lastObj = lastObj[part];
            }

            delete lastObj[finalPart];

            // Delete from database
            if (this.user_id !== undefined) {
                this.deleteUserPrivilege(name).then(result => resolve(result), err => reject(err));
            } else if (this.pt_name !== undefined) {
                this.deletePTPrivilege(name).then(result => resolve(result), err => reject(err));
            } else {
                reject('User ID or privilege template name not set');
            }
        });
    }

    /**
     * Saves the privilege to the database for a user.
     * @param {string} name The privilege name.
     * @param {boolean} granted Whether the privilege is granted or not.
     * @returns {Promise<boolean>|Promise<Error>} True on success.
     */
    saveUserPrivilege(name, granted) {
        return new Promise((resolve, reject) => {
            if (this.user_id === undefined) {
                reject('User ID not set');
                return;
            }

            const connection = mysql.getConnection('modify');

            connection.connect();

            connection.query(
                'SELECT COUNT(*) AS PrivilegeCount FROM privileges WHERE user_id = UNHEX(' + connection.escape(
                this.user_id) + ') AND privilege_name = ' + connection.escape(name),
                (error, results) => {
                    if (error) {
                        connection.end();
                        reject(error);
                        return;
                    }

                    const { PrivilegeCount } = results[0];
                    if (PrivilegeCount > 0) {
                        // Update existing privilege
                        connection.query('UPDATE privileges ' +
                            'SET granted = ' + (granted === true ? 1 : 0) + ' ' +
                            'WHERE user_id = UNHEX(' + connection.escape(this.user_id) + ') ' +
                            'AND privilege_name = ' + connection.escape(name),
                            (error) => {
                                connection.end();

                                if (error) {
                                    reject(error);
                                    return;
                                }

                                resolve(true);
                            });
                    } else {
                        // Insert new privilege
                        connection.query('INSERT INTO privileges VALUES(' +
                            'UNHEX(' + connection.escape(this.user_id) + '), ' +
                            connection.escape(name) + ', ' +
                            (granted === true ? 1 : 0) + ')',
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
     * Saves the privilege to the database for a privilege template.
     * @param {string} name The privilege name.
     * @param {boolean} granted Whether the privilege is granted or not.
     * @returns {Promise<boolean>|Promise<Error>} True on success.
     */
    savePTPrivilege(name, granted) {
        return new Promise((resolve, reject) => {
            if (this.pt_name === undefined) {
                reject('Privilege template name not set');
                return;
            }

            const connection = mysql.getConnection('modify');

            connection.connect();

            connection.query('SELECT privileges FROM privilege_templates WHERE name = ' +
                connection.escape(this.pt_name),
                (error, results) => {
                    if (error) {
                        connection.end();
                        reject(error);
                        return;
                    }

                    const json = JSON.parse(results[0].privileges);
                    json[name] = (granted === true ? 1 : 0);

                    connection.query('UPDATE privilege_templates SET privileges = ' +
                        connection.escape(JSON.stringify(json)) + ' ' +
                        'WHERE name = ' + connection.escape(this.pt_name),
                        (error, results) => {
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
     * Deletes a privilege from the database for a user.
     * @param {string} name The privilege name.
     * @returns {Promise<boolean>|Promise<Error>} True on success.
     */
    deleteUserPrivilege(name) {
        return new Promise((resolve, reject) => {
            if (this.user_id === undefined) {
                reject('User ID not set');
                return;
            }

            const connection = mysql.getConnection('delete');

            connection.connect();

            connection.query(
                'DELETE FROM privileges WHERE ' +
                'user_id = UNHEX(' + connection.escape(this.user_id) + ') ' +
                'AND privilege_name = ' + connection.escape(name),
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
     * Deletes a privilege from the database for a privilege template.
     * @param {string} name The privilege name.
     * @returns {Promise<boolean>|Promise<Error>} True on success.
     */
    deletePTPrivilege(name) {
        return new Promise((resolve, reject) => {
            if (this.pt_name === undefined) {
                reject('Privilege template name not set');
                return;
            }

            const connection = mysql.getConnection('modify');

            connection.connect();

            connection.query('SELECT privileges FROM privilege_templates WHERE name = ' +
                connection.escape(this.pt_name),
                (error, results) => {
                    if (error) {
                        connection.end();
                        reject(error);
                        return;
                    }

                    const json = JSON.parse(results[0].privileges);
                    delete json[name];

                    connection.query('UPDATE privilege_templates SET privileges = ' +
                        connection.escape(JSON.stringify(json)) + ' ' +
                        'WHERE name = ' + connection.escape(this.pt_name),
                        (error, results) => {
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
     * Counts the number of privileges the user or privilege template has been granted.
     * @return {number} The number of privileges.
     */
    countGrantedPrivileges() {
        if (typeof this.privileges !== 'object') {
            return 0;
        }

        const countKeys = obj => Object.keys(obj).reduce(((acc, cur) => {
            if (typeof obj[cur] === 'object') {
                return acc + countKeys(obj[cur]);
            }

            return ++acc;
        }), 0);

        return countKeys(this.privileges);
    }
};

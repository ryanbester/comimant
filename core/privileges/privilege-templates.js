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
const { PrivilegeTemplate } = require('./privilege-template');

/**
 * Utility class for managing privilege templates.
 * @type {PrivilegeTemplates}
 */
module.exports.PrivilegeTemplates = class PrivilegeTemplates {

    /**
     * Gets all the privilege templates in the database.
     * @return {Promise<array>|Promise<Error>} An array of PrivilegeTemplate objects.
     */
    static getPrivilegeTemplates() {
        return new Promise((resolve, reject) => {
            const connection = mysql.getConnection();

            connection.connect();

            connection.query('SELECT * FROM privilege_templates',
                (error, results) => {
                    connection.end();

                    if (error) {
                        reject(error);
                        return;
                    }

                    let privilegeTemplates = [];

                    Object.keys(results).forEach(key => {
                        privilegeTemplates.push(new PrivilegeTemplate(
                            results[key].name,
                            results[key].title,
                            JSON.parse(results[key].privileges),
                            results[key].default_template
                        ));
                    });

                    resolve(privilegeTemplates);
                });
        });
    }

};
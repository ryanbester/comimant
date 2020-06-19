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

const mysql = require('mysql');

module.exports.getConnection = (type) => {
    let username = process.env.DB_USER;
    let password = process.env.DB_PASS;

    if (type === 'modify') {
        username = process.env.DB_USER_MODIFY;
        password = process.env.DB_PASS_MODIFY;
    } else if (type === 'delete') {
        username = process.env.DB_USER_DELETE;
        password = process.env.DB_PASS_DELETE;
    }

    return mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: username,
        password: password,
        database: process.env.DB_DATABASE
    });
};

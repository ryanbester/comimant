/*
 * Copyright (C) 2019 - 2020 Comimant
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

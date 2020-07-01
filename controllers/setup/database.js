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

const childProcess = require('child_process');
const mysql = require('../../db/mysql');

const { Logger } = require('../../core/logger');
const { Nonce } = require('../../core/auth/nonce');
const { AccessToken } = require('../../core/auth/access-token');
const { Util } = require('../../core/util');

const renderPage = (req, res, error, success) => {
    res.render('setup/install-database', {
        title: 'Setup',
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_DATABASE,
        user: process.env.DB_USER,
        userModify: process.env.DB_USER_MODIFY,
        userDelete: process.env.DB_USER_DELETE,
        error: error,
        success: success
    });
};

exports.showDatabasePage = (req, res, next) => {
    if (res.locals.setupAction === 'initial') {
        renderPage(req, res);
    } else {
        const err = new Error('404: Page not found');
        err.status = 404;
        next(err);
    }
};

exports.saveDatabase = (req, res, next) => {
    if (res.locals.setupAction === 'initial') {
        if (process.env.DB_HOST === undefined || process.env.DB_HOST === '') {
            renderPage(req, res, 'Database host not set in ecosystem file');
            return;
        }

        if (process.env.DB_PORT === undefined || process.env.DB_PORT === '') {
            renderPage(req, res, 'Database port not set in ecosystem file');
            return;
        }

        if (process.env.DB_DATABASE === undefined || process.env.DB_DATABASE === '') {
            renderPage(req, res, 'Database name not set in ecosystem file');
            return;
        }

        if (process.env.DB_USER === undefined || process.env.DB_USER === '') {
            renderPage(req, res, 'Standard user name not set in ecosystem file');
            return;
        }

        if (process.env.DB_PASS === undefined || process.env.DB_PASS === '') {
            renderPage(req, res, 'Standard user password not set in ecosystem file');
            return;
        }

        if (process.env.DB_USER_MODIFY === undefined || process.env.DB_USER_MODIFY === '') {
            renderPage(req, res, 'Modify user name not set in ecosystem file');
            return;
        }

        if (process.env.DB_PASS_MODIFY === undefined || process.env.DB_PASS_MODIFY === '') {
            renderPage(req, res, 'Modify user password not set in ecosystem file');
            return;
        }

        if (process.env.DB_USER_DELETE === undefined || process.env.DB_USER_DELETE === '') {
            renderPage(req, res, 'Delete user name not set in ecosystem file');
            return;
        }

        if (process.env.DB_PASS_DELETE === undefined || process.env.DB_PASS_DELETE === '') {
            renderPage(req, res, 'Delete user password not set in ecosystem file');
            return;
        }

        const connection = mysql.getConnection();

        connection.connect();

        checkDatabase(req, res, connection);
    } else {
        const err = new Error('404: Page not found');
        err.status = 404;
        next(err);
    }
};

const checkDatabase = (req, res, connection) => {
    // Check if database exists
    connection.query('SHOW DATABASES LIKE ' + connection.escape(process.env.DB_DATABASE),
        (error, results) => {
            if (error) {
                connection.end();
                Logger.error(error);

                if (error.code === 'ECONNREFUSED') {
                    renderPage(req, res, 'Cannot connect to database server: connection refused');
                } else if (error.code === 'ER_DBACCESS_DENIED_ERROR') {
                    renderPage(req, res,
                        'Access denied for user: ' + process.env.DB_USER + '. Check if the database exists and the user has permission');
                } else {
                    renderPage(req, res, 'Error, check server log for details');
                }
                return;
            }

            if (results.length < 1) {
                connection.end();
                renderPage(req, res, 'Database does not exist');
                return;
            }

            createDatabaseTables(req, res, connection);
        });
};

const createDatabaseTables = (req, res, connection) => {
    connection.end();

    // Escalate to modify user
    connection = mysql.getConnection('modify');
    connection.connect();

    // Start creating tables;
    createUsersTable(req, res, connection);
};

const handleTableCreationError = (req, res, error) => {
    Logger.error(error);

    if (error.code === 'ER_DBACCESS_DENIED_ERROR') {
        renderPage(req, res,
            'Access denied. Check if the database exists and the user has permission');
    } else {
        renderPage(req, res, 'Error, check server log for details');
    }
};

const createUsersTable = (req, res, connection) => {
    connection.query('CREATE TABLE IF NOT EXISTS `users` (' +
        '  `user_id` binary(16) NOT NULL,' +
        '  `username` varchar(32) NOT NULL,' +
        '  `email_address` varbinary(2048) NOT NULL,' +
        '  `first_name` varchar(255) NOT NULL,' +
        '  `last_name` varchar(255) NOT NULL,' +
        '  `dob` date NULL,' +
        '  `date_added` datetime NOT NULL,' +
        '  `image_url` text NULL,' +
        '  `locked` tinyint(1) NULL,' +
        '  PRIMARY KEY (`user_id`),' +
        '  UNIQUE KEY `idx_username` (`username`)' +
        ')',
        (error) => {
            if (error) {
                connection.end();
                handleTableCreationError(req, res, error);
                return;
            }

            createAccessTokensTable(req, res, connection);
        });
};

const createAccessTokensTable = (req, res, connection) => {
    connection.query('CREATE TABLE IF NOT EXISTS `access_tokens` (' +
        '  `access_token` binary(32) NOT NULL,' +
        '  `user_id` binary(16) NOT NULL,' +
        '  `expires` datetime NOT NULL,' +
        '  PRIMARY KEY (`access_token`),' +
        '  KEY `user_id` (`user_id`),' +
        '  CONSTRAINT `access_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE' +
        ')',
        (error) => {
            if (error) {
                connection.end();
                handleTableCreationError(req, res, error);
                return;
            }

            createEnabledPluginsTable(req, res, connection);
        });
};

const createEnabledPluginsTable = (req, res, connection) => {
    connection.query('CREATE TABLE IF NOT EXISTS `enabled_plugins` (' +
        '  `id` varchar(255) NOT NULL,' +
        '  `name` varchar(255) NOT NULL,' +
        '  `manifest_path` varchar(255) NOT NULL' +
        ')',
        (error) => {
            if (error) {
                connection.end();
                handleTableCreationError(req, res, error);
                return;
            }

            createNoncesTable(req, res, connection);
        });
};

const createNoncesTable = (req, res, connection) => {
    connection.query('CREATE TABLE IF NOT EXISTS `nonces` (' +
        '  `id` binary(32) NOT NULL,' +
        '  `name` text NOT NULL,' +
        '  `url` text NOT NULL,' +
        '  `expires` datetime NOT NULL,' +
        '  PRIMARY KEY (`id`)' +
        ')',
        (error) => {
            if (error) {
                connection.end();
                handleTableCreationError(req, res, error);
                return;
            }

            createPasswdTable(req, res, connection);
        });
};

const createPasswdTable = (req, res, connection) => {
    connection.query('CREATE TABLE IF NOT EXISTS `passwd` (' +
        '  `user_id` binary(16) NOT NULL,' +
        '  `password` text NOT NULL,' +
        '  `salt` binary(32) NOT NULL,' +
        '  `salt_iv` binary(16) NOT NULL,' +
        '  PRIMARY KEY (`user_id`),' +
        '  CONSTRAINT `passwd_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE' +
        ')',
        (error) => {
            if (error) {
                connection.end();
                handleTableCreationError(req, res, error);
                return;
            }

            createPrivilegeTemplatesTable(req, res, connection);
        });
};

const createPrivilegeTemplatesTable = (req, res, connection) => {
    connection.query('CREATE TABLE IF NOT EXISTS `privilege_templates` (' +
        '  `name` varchar(255) NOT NULL,' +
        '  `title` varchar(255) NOT NULL,' +
        '  `privileges` text NULL,' +
        '  `default_template` tinyint(1) NULL' +
        ')',
        (error) => {
            if (error) {
                connection.end();
                handleTableCreationError(req, res, error);
                return;
            }

            createPrivilegesTable(req, res, connection);
        });
};

const createPrivilegesTable = (req, res, connection) => {
    connection.query('CREATE TABLE IF NOT EXISTS `privileges` (' +
        '  `user_id` binary(16) NOT NULL,' +
        '  `privilege_name` varchar(255) NOT NULL,' +
        '  `granted` tinyint(1) DEFAULT NULL,' +
        '  KEY `user_id` (`user_id`),' +
        '  UNIQUE KEY `idx_privilege` (`privilege_name`),' +
        '  CONSTRAINT `privileges_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE' +
        ')',
        (error) => {
            if (error) {
                connection.end();
                handleTableCreationError(req, res, error);
                return;
            }

            createServicesTable(req, res, connection);
        });
};

const createServicesTable = (req, res, connection) => {
    connection.query('CREATE TABLE IF NOT EXISTS `services` (' +
        '  `user_id` binary(16) NOT NULL,' +
        '  `service_type` varchar(255) NOT NULL,' +
        '  `service_name` varchar(255) NOT NULL,' +
        '  `service_title` varchar(255) NOT NULL,' +
        '  `service_user_id` varchar(255) NOT NULL' +
        ')',
        (error) => {
            if (error) {
                connection.end();
                handleTableCreationError(req, res, error);
                return;
            }

            createSudoAccessTokensTable(req, res, connection);
        });
};

const createSudoAccessTokensTable = (req, res, connection) => {
    connection.query('CREATE TABLE IF NOT EXISTS `sudo_access_tokens` (' +
        '  `access_token` binary(32) NOT NULL,' +
        '  `user_id` binary(16) NOT NULL,' +
        '  `expires` datetime NOT NULL,' +
        '  PRIMARY KEY (`access_token`),' +
        '  KEY `user_id` (`user_id`),' +
        '  CONSTRAINT `sudo_access_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE' +
        ')',
        (error) => {
            if (error) {
                connection.end();
                handleTableCreationError(req, res, error);
                return;
            }

            createWidgetLayoutsTable(req, res, connection);
        });
};

const createWidgetLayoutsTable = (req, res, connection) => {
    connection.query('CREATE TABLE IF NOT EXISTS `widget_layouts` (' +
        '  `user_id` binary(16) NOT NULL,' +
        '  `layout` text NULL,' +
        '  PRIMARY KEY (`user_id`),' +
        '  KEY `user_id` (`user_id`),' +
        '  CONSTRAINT `widget_layouts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE' +
        ')',
        (error) => {
            if (error) {
                connection.end();
                handleTableCreationError(req, res, error);
                return;
            }

            createWidgetsTable(req, res, connection);
        });
};

const createWidgetsTable = (req, res, connection) => {
    connection.query('CREATE TABLE IF NOT EXISTS `widgets` (' +
        '  `widget_id` binary(16) NOT NULL,' +
        '  `user_id` binary(16) NOT NULL,' +
        '  `type` text NULL,' +
        '  `title` text NULL,' +
        '  `data` text NULL,' +
        '  PRIMARY KEY (`widget_id`),' +
        '  KEY `user_id` (`user_id`),' +
        '  CONSTRAINT `widgets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE' +
        ')',
        (error) => {
            if (error) {
                connection.end();
                handleTableCreationError(req, res, error);
                return;
            }

            renderPage(req, res, undefined, 'Created database tables');
        });
};
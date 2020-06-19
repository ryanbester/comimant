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

const path = require('path');
const fs = require('fs');

const { Logger } = require('./logger');

/**
 * Configuration class
 * @type {Config}
 */
module.exports.Config = class Config {

    /**
     * Creates a new instance of the Configuration class and loads the configuration from the JSON file.
     */
    constructor() {
        this.loadConfig();
    }

    /**
     * Gets the current instance of the Config class. This will create a new instance for each instance of the
     * application.
     * @return {Config} The Config object
     */
    static getInstance() {
        if (Config.instance === undefined) {
            Config.instance = new Config();
        }

        return Config.instance;
    }

    /**
     * Loads the configuration from the JSON file and stores it in the class instance.
     * @return {boolean} True if the configuration file has been parsed correctly, false on failure.
     */
    loadConfig() {
        try {
            let configFile = path.normalize(__approot + '/config.json');
            if (process.env.CONFIG_FILE !== undefined) {
                if (process.env.CONFIG_FILE.startsWith('/')) {
                    configFile = path.normalize(process.env.CONFIG_FILE);
                } else {
                    configFile = path.normalize(__approot + '/' + process.env.CONFIG_FILE);
                }
            }

            const data = fs.readFileSync(configFile, 'utf8');
            this.config = JSON.parse(data);

            return true;
        } catch (e) {
            Logger.error('Cannot load Comimant configuration file');
            return false;
        }
    }

    /**
     * Gets an option from the configuration file.
     * @param {string} name The fully qualified path of the configuration option.
     * @param {any} defaultValue The default value to return if the option is null.
     * @return {null|any} Returns the option as an object or primitive type, or null on failure.
     */
    getOption(name, defaultValue = null) {
        const parts = name.split('.');

        let lastObj = this.config;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!lastObj.hasOwnProperty(part)) {
                return defaultValue;
            }

            lastObj = lastObj[part];
        }

        return lastObj;
    }

};
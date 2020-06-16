/*
 * Copyright (C) 2019 - 2020 Bester Intranet
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
            Logger.error('Cannot load Comimant configuration file' + e);
            return false;
        }
    }

    /**
     * Gets an option from the configuration file.
     * @param {string} name The fully qualified path of the configuration option.
     * @return {null|any} Returns the option as an object or primitive type, or null on failure.
     */
    getOption(name) {
        const parts = name.split('.');

        let lastObj = this.config;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!lastObj.hasOwnProperty(part)) {
                return null;
            }

            lastObj = lastObj[part];
        }

        return lastObj;
    }

};
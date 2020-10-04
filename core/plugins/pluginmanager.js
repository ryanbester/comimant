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

const fs = require('fs');
const path = require('path');

const mysql = require('../../db/mysql');
const redis = require('../../db/redis');
const { Util } = require('../util');
const { Logger } = require('../logger');
const { Config } = require('../config');

/**
 * The `PluginManager` class keeps track of what listeners are registered, what scripts are enqueued, and allows
 * plugins to be easily enabled, activated, deactivated, and disabled.
 * @type {PluginManager}
 */
module.exports.PluginManager = class PluginManager {

    /**
     * Scans `PLUGINS_DIR` for plugins.
     * @return {string[]} List of plugin IDs.
     */
    static getAllPlugins() {
        // noinspection JSValidateTypes
        return fs.readdirSync(process.env.PLUGINS_DIR, {
            withFileTypes: true
        }).filter(dirEnt => dirEnt.isDirectory).map(dirEnt => dirEnt.name);
    }

    /**
     * Queries the database to get a list of enabled plugins. Each plugin in the database will automatically have its
     * manifest file validated, and be added to the Redis cache.
     * @return {Promise<boolean>|Promise<Error>}
     */
    static getEnabledPlugins() {
        return new Promise((resolve, reject) => {
                const connection = mysql.getConnection();

                connection.connect();

                connection.query('SELECT * FROM enabled_plugins',
                    (error, results) => {
                        connection.end();

                        if (error) {
                            reject(error);
                            return;
                        }

                        if (results.length > 0) {
                            const client = redis.getConnection();

                            Object.keys(results).forEach(key => {
                                const { manifest_path, id, name } = results[key];
                                const data = PluginManager.readPluginManifest(manifest_path);

                                if (!data) {
                                    Logger.error('Cannot read manifest file: ' + manifest_path);
                                } else {
                                    if (!data.hasOwnProperty('main')) {
                                        Logger.error(
                                            'Manifest file: ' + manifest_path + ' does not have required "main" attribute');
                                    } else if (!data.hasOwnProperty('mainClass')) {
                                        Logger.error(
                                            'Manifest file: ' + manifest_path + ' does not have required "mainClass" attribute');
                                    } else {
                                        client.sadd('plugins', id);
                                        client.hmset('plugin:' + id,
                                            'name', name,
                                            'manifest', manifest_path,
                                            'main', data.main,
                                            'mainClass', data.mainClass);
                                    }
                                }
                            });
                        }

                        resolve(true);
                    });
            }
        );
    }

    /**
     * Registers a plugin.
     * @param {Plugin} plugin The plugin object.
     * @param {string} id The ID of the plugin.
     * @return {boolean} True on success or false on failure.
     */
    static registerPlugin(plugin, id) {
        if (PluginManager.registeredPlugins === undefined) {
            PluginManager.registeredPlugins = [];
        }

        const data = PluginManager.readPluginManifest(id + '/manifest.json');

        if (!data) {
            return false;
        } else {
            if (!data.hasOwnProperty('mainClass')) {
                return false;
            } else {
                if (plugin.name === data.mainClass) {
                    PluginManager.registeredPlugins[plugin.name] = id;
                    return true;
                } else {
                    return false;
                }
            }
        }
    }

    /**
     * Enables the plugin, validating the manifest file, and adding the plugin to the database and Redis cache, before
     * sending a
     * `callOnEnable:[pluginID]` signal.
     * @param {string} id The plugin ID.
     * @return {Promise<boolean>|Promise<Error>} True on success.
     */
    static enablePlugin(id) {
        const caller = Util.getCallerFile();
        if (caller.startsWith(process.env.PLUGINS_DIR)) {
            const pluginPath = caller.replace(process.env.PLUGINS_DIR + '/', '');
            const plugin = pluginPath.substring(0, pluginPath.indexOf('/'));

            return new Promise((resolve, reject) => {
                reject('enablePlugin() can not be called from a plugin');
                PluginManager.restrictedMethodAction('enablePlugin()', plugin);
            });
        }

        return new Promise((resolve, reject) => {
            const data = PluginManager.readPluginManifest(id + '/manifest.json');

            if (!data) {
                reject('Cannot read manifest file: ' + id + '/manifest.json');
            } else {
                if (!data.hasOwnProperty('main')) {
                    reject('Manifest file: ' + id + '/manifest.json does not have required "main" attribute');
                } else if (!data.hasOwnProperty('mainClass')) {
                    reject('Manifest file: ' + id + '/manifest.json does not have required "mainClass" attribute');
                } else if (!data.hasOwnProperty('name')) {
                    reject('Manifest file: ' + id + '/manifest.json does not have required "name" attribute');
                } else {
                    // Add to database
                    const connection = mysql.getConnection();
                    connection.connect();

                    connection.query('INSERT INTO enabled_plugins VALUES('
                        + connection.escape(id) + ', '
                        + connection.escape(data.name) + ', '
                        + connection.escape(id + '/manifest.json') + ')',
                        (error) => {
                            connection.end();

                            if (error) {
                                reject(error);
                                return;
                            }

                            const client = redis.getConnection();
                            client.sadd('plugins', id);
                            client.hmset('plugin:' + id,
                                'name', data.name,
                                'manifest_path', id + '/manifest.json',
                                'main', data.main,
                                'mainClass', data.mainClass);

                            client.publish('plugin-manager', 'callOnEnable:' + id + '/' + data.main);

                            resolve(true);
                        });
                }
            }
        });
    }

    /**
     * Disables the plugin, removing the plugin from the database and the Redis cache, before sending a
     * `callOnDisable:[pluginID]` signal.
     * @param {string} id The plugin ID.
     * @return {Promise<boolean>|Promise<Error>} True on success.
     */
    static disablePlugin(id) {
        const caller = Util.getCallerFile();
        if (caller.startsWith(process.env.PLUGINS_DIR)) {
            const pluginPath = caller.replace(process.env.PLUGINS_DIR + '/', '');
            const plugin = pluginPath.substring(0, pluginPath.indexOf('/'));

            return new Promise((resolve, reject) => {
                reject('disablePlugin() can not be called from a plugin');
                PluginManager.restrictedMethodAction('disablePlugin()', plugin);
            });
        }

        return new Promise((resolve, reject) => {
            // Remove from database
            const connection = mysql.getConnection('delete');
            connection.connect();

            connection.query('DELETE FROM enabled_plugins WHERE id = ' + connection.escape(id),
                (error) => {
                    connection.end();

                    if (error) {
                        reject(error);
                        return;
                    }

                    const client = redis.getConnection();
                    client.hget('plugin:' + id, 'main', (err, res) => {
                        const main = res;
                        client.srem('plugins', id);
                        client.del('plugin:' + id);

                        client.publish('plugin-manager', 'callOnDisable' + id + '/' + main);

                        resolve(true);
                    });
                });
        });
    }

    /**
     * Sends a `callOnActivate:[pluginID]` signal for all plugins that are in the Redis cache.
     */
    static activateEnabledPlugins() {
        const caller = Util.getCallerFile();
        if (caller.startsWith(process.env.PLUGINS_DIR)) {
            const pluginPath = caller.replace(process.env.PLUGINS_DIR + '/', '');
            const plugin = pluginPath.substring(0, pluginPath.indexOf('/'));

            Logger.error('activateEnabledPlugins() can not be called from a plugin');
            PluginManager.restrictedMethodAction('activateEnabledPlugin()', plugin);
            return;
        }

        const client = redis.getConnection();

        client.smembers('plugins', (err, res) => {
            if (err) {
                return false;
            }

            for (let i = 0; i < res.length; i++) {
                let id = res[i];

                client.hget('plugin:' + id, 'main', (err, res) => {
                    if (err) {
                        return false;
                    }

                    client.publish('plugin-manager', 'callOnActivate:' + id + '/' + res);

                    return true;
                });
            }
        });
    }

    /**
     * Sends a `callOnActivate:[pluginID]` signal for the plugin.
     * @param {string} id The plugin ID.
     */
    static activatePlugin(id) {
        const caller = Util.getCallerFile();
        if (caller.startsWith(process.env.PLUGINS_DIR)) {
            const pluginPath = caller.replace(process.env.PLUGINS_DIR + '/', '');
            const plugin = pluginPath.substring(0, pluginPath.indexOf('/'));

            Logger.error('activatePlugin() can not be called from a plugin');
            PluginManager.restrictedMethodAction('activatePlugin()', plugin);
            return;
        }

        const client = redis.getConnection();
        client.hget('plugin:' + id, 'main', (err, res) => {
            if (err) {
                return false;
            }

            client.publish('plugin-manager', 'callOnActivate:' + id + '/' + res);

            return true;
        });
    }

    /**
     * Sends a `callOnDeactivate:[pluginID]` signal for the plugin.
     * @param {string} id The plugin ID.
     */
    static deactivatePlugin(id) {
        const caller = Util.getCallerFile();
        if (caller.startsWith(process.env.PLUGINS_DIR)) {
            const pluginPath = caller.replace(process.env.PLUGINS_DIR + '/', '');
            const plugin = pluginPath.substring(0, pluginPath.indexOf('/'));

            Logger.error('deactivatePlugin() can not be called from a plugin');
            PluginManager.restrictedMethodAction('deactivatePlugin()', plugin);
            return;
        }

        const client = redis.getConnection();
        client.hget('plugin:' + id, 'main', (err, res) => {
            if (err) {
                return false;
            }

            client.publish('plugin-manager', 'callOnDeactivate' + id + '/' + res);

            return true;
        });
    }

    /**
     * Reads and parses the manifest file.
     * @param {string} manifestPath The path to the manifest file, relative to `PLUGINS_DIR`.
     * @return {boolean|any} Returns the JSON data as an object, or false if the file cannot be read or contains
     *     malformed JSON data.
     */
    static readPluginManifest(manifestPath) {
        try {
            const data = fs.readFileSync(path.normalize(process.env.PLUGINS_DIR + '/' + manifestPath), 'utf8');
            try {
                return JSON.parse(data);
            } catch (e) {
                return false;
            }
        } catch (e) {
            Logger.error(e);
            return false;
        }
    }

    /**
     * Helper method to call the `onEnable()` method of the plugin.
     * @param {string} main The plugin ID or plugin directory.
     */
    static callOnEnable(main) {
        const caller = Util.getCallerFile();
        if (caller.startsWith(process.env.PLUGINS_DIR)) {
            const pluginPath = caller.replace(process.env.PLUGINS_DIR + '/', '');
            const plugin = pluginPath.substring(0, pluginPath.indexOf('/'));

            Logger.error('callOnEnable() can not be called from a plugin');
            PluginManager.restrictedMethodAction('callOnEnable()', plugin);
            return;
        }

        const plugin = require(path.normalize(process.env.PLUGINS_DIR + '/' + main));
        plugin.onEnable();
    }

    /**
     * Helper method to call the `onDisable()` method of the plugin.
     * @param {string} main The plugin ID or plugin directory.
     */
    static callOnDisable(main) {
        const caller = Util.getCallerFile();
        if (caller.startsWith(process.env.PLUGINS_DIR)) {
            const pluginPath = caller.replace(process.env.PLUGINS_DIR + '/', '');
            const plugin = pluginPath.substring(0, pluginPath.indexOf('/'));

            Logger.error('callOnDisable() can not be called from a plugin');
            PluginManager.restrictedMethodAction('callOnDisable()', plugin);
            return;
        }

        const plugin = require(path.normalize(process.env.PLUGINS_DIR + '/' + main));
        plugin.onDisable();
    }

    /**
     * Helper method to call the `onActivate()` method of the plugin.
     * @param {string} main The plugin ID or plugin directory.
     */
    static callOnActivate(main) {
        const caller = Util.getCallerFile();
        if (caller.startsWith(process.env.PLUGINS_DIR)) {
            const pluginPath = caller.replace(process.env.PLUGINS_DIR + '/', '');
            const plugin = pluginPath.substring(0, pluginPath.indexOf('/'));

            Logger.error('callOnActivate() can not be called from a plugin');
            PluginManager.restrictedMethodAction('callOnActivate()', plugin);
            return;
        }

        const plugin = require(path.normalize(process.env.PLUGINS_DIR + '/' + main));
        plugin.onActivate();
    }

    /**
     * Helper method to call the `onDeactivate()` method of the plugin. This method will also unregister the plugin,
     * and remove all event listeners associated with it and scripts it has enqueued.
     * @param {string} main The plugin ID or plugin directory.
     */
    static callOnDeactivate(main) {
        const caller = Util.getCallerFile();
        if (caller.startsWith(process.env.PLUGINS_DIR)) {
            const pluginPath = caller.replace(process.env.PLUGINS_DIR + '/', '');
            const plugin = pluginPath.substring(0, pluginPath.indexOf('/'));

            Logger.error('callOnDeactivate() can not be called from a plugin');
            PluginManager.restrictedMethodAction('callOnDeactivate()', plugin);
            return;
        }

        const plugin = require(path.normalize(process.env.PLUGINS_DIR + '/' + main));
        plugin.onDeactivate();

        if (!PluginManager.registeredPlugins === undefined) {
            PluginManager.registeredPlugins = [];
        }

        if (PluginManager.registeredPlugins.hasOwnProperty(plugin.name)) {
            delete PluginManager.registeredPlugins[plugin.name];
        }

        PluginManager.removePluginEventListeners(plugin);
        PluginManager.removePluginEnqueuedScripts(plugin);
    }

    /**
     * Registers an event listener.
     * @param {Plugin} plugin The plugin.
     * @param {string} event Event name.
     * @param {function(string, ...)} callback The callback function.
     */
    static addEventListener(plugin, event, callback) {
        if (PluginManager.registeredEventListeners === undefined) {
            PluginManager.registeredEventListeners = [];
        }

        if (!PluginManager.registeredEventListeners.hasOwnProperty(event)) {
            PluginManager.registeredEventListeners[event] = [];
        }

        PluginManager.registeredEventListeners[event].push({
            plugin: plugin.name,
            callback: callback
        });
    }

    /**
     * Unregisters all event registers associated with the plugin.
     * @param {Plugin} plugin The plugin.
     */
    static removePluginEventListeners(plugin) {
        if (PluginManager.registeredEventListeners === undefined) {
            PluginManager.registeredEventListeners = [];
            return;
        }

        Object.keys(PluginManager.registeredEventListeners).forEach(key => {
            let callbacks = PluginManager.registeredEventListeners[key];

            PluginManager.removeItems(callbacks, plugin);
        });
    }

    /**
     * Internal method to enqueue a script.
     * @param {string} pos The position of the script.
     * @param {Plugin} plugin The plugin.
     * @param {string} page The page.
     * @param {string} url The URL.
     * @param {string} src The source file.
     * @param {boolean} async Whether the script is loading asynchronously.
     * @return {string|boolean} The script URL on success or false on failure.
     */
    static enqueueScript(pos, plugin, page, url, src, async = true) {
        const listName = 'enqueuedScripts' + pos;
        if (PluginManager[listName] === undefined) {
            PluginManager[listName] = [];
        }

        if (!PluginManager[listName].hasOwnProperty(page)) {
            PluginManager[listName][page] = [];
        }

        if (PluginManager.registeredPlugins === undefined) {
            PluginManager.registeredPlugins = [];
            return false;
        }

        if (!PluginManager.registeredPlugins.hasOwnProperty(plugin.name)) {
            return false;
        }

        PluginManager[listName][page].push({
            plugin: plugin.name,
            url: url,
            src: path.normalize(
                process.env.PLUGINS_DIR + '/' + PluginManager.registeredPlugins[plugin.name] + '/' + src),
            async: async
        });

        return '/scripts/plugins/' + plugin.name + '/' + url;
    }

    /**
     * Enqueues a script to be loaded before other scripts on the page.
     * @param {Plugin} plugin The plugin.
     * @param {string} page The page the script will be enqueued for.
     * @param {string} url The URL the script is accessible at.
     * @param {string} src The path to the script file.
     * @param {boolean} async Whether the script should be loaded asynchronously.
     * @return {string|boolean} The script URL on success or false on failure.
     */
    static enqueueScriptBefore(plugin, page, url, src, async = true) {
        return PluginManager.enqueueScript('Before', plugin, page, url, src, async);
    }

    /**
     * Enqueues a script to be loaded after other scripts on the page.
     * @param {Plugin} plugin The plugin.
     * @param {string} page The page the script will be enqueued for.
     * @param {string} url The URL the script is accessible at.
     * @param {string} src The path to the script file.
     * @param {boolean} async Whether the script should be loaded asynchronously.
     * @return {string|boolean} The script URL on success or false on failure.
     */
    static enqueueScriptAfter(plugin, page, url, src, async = true) {
        return PluginManager.enqueueScript('After', plugin, page, url, src, async);
    }

    /**
     * Gets a list of scripts that are enqueued to be loaded before other scripts.
     * @param {string} page The page.
     * @return {*[]|*} The list of scripts.
     */
    static getEnqueuedScriptsBefore(page) {
        if (PluginManager.enqueuedScriptsBefore === undefined) {
            PluginManager.enqueuedScriptsBefore = [];
            return [];
        }

        if (!PluginManager.enqueuedScriptsBefore.hasOwnProperty(page)) {
            return [];
        }

        return PluginManager.enqueuedScriptsBefore[page];
    }

    /**
     * Gets a list of scripts that are enqueued to be loaded after other scripts.
     * @param {string} page The page.
     * @return {*[]|*} The list of scripts.
     */
    static getEnqueuedScriptsAfter(page) {
        if (PluginManager.enqueuedScriptsAfter === undefined) {
            PluginManager.enqueuedScriptsAfter = [];
            return [];
        }

        if (!PluginManager.enqueuedScriptsAfter.hasOwnProperty(page)) {
            return [];
        }

        return PluginManager.enqueuedScriptsAfter[page];
    }

    /**
     * Remove all enqueued scripts for the plugin.
     * @param {Plugin} plugin The plugin.
     */
    static removePluginEnqueuedScripts(plugin) {
        if (PluginManager.enqueuedScriptsBefore === undefined) {
            PluginManager.enqueuedScriptsBefore = [];
        }

        if (PluginManager.enqueuedScriptsAfter === undefined) {
            PluginManager.enqueuedScriptsAfter = [];
        }

        const removeScripts = (pos) => {
            const listName = 'enqueuedScripts' + pos;
            Object.keys(PluginManager[listName]).forEach(key => {
                let scripts = PluginManager[listName][key];

                PluginManager.removeItems(scripts, plugin);
            });
        };

        removeScripts('Before');
        removeScripts('After');
    }

    /**
     * Internal method to enqueue a stylesheet.
     * @param pos The position of the stylesheet.
     * @param plugin The plugin.
     * @param url The URL.
     * @param src The source file.
     * @returns {string|boolean} The stylesheet URL on success or false on failure.
     */
    static enqueueStylesheet(pos, plugin, url, src) {
        const listName = 'enqueuedStylesheets' + pos;
        if (PluginManager[listName] === undefined) {
            PluginManager[listName] = [];
        }

        if (PluginManager.registeredPlugins === undefined) {
            PluginManager.registeredPlugins = [];
            return false;
        }

        if (!PluginManager.registeredPlugins.hasOwnProperty(plugin.name)) {
            return false;
        }

        PluginManager[listName].push({
            plugin: plugin.name,
            url: url,
            src: path.normalize(
                process.env.PLUGINS_DIR + '/' + PluginManager.registeredPlugins[plugin.name] + '/' + src)
        });

        return '/stylesheets/plugins/' + plugin.name + '/' + url;
    }

    /**
     * Enqueues a stylesheet to be loaded before other stylesheets.
     * @param plugin The plugin.
     * @param url The URL.
     * @param src The source file.
     * @returns {string|boolean} The stylesheet URL on success or false on failure.
     */
    static enqueueStylesheetBefore(plugin, url, src) {
        return PluginManager.enqueueStylesheet('Before', plugin, url, src);
    }

    /**
     * Enqueues a stylesheet to be loaded after other stylesheets.
     * @param plugin The plugin.
     * @param url The URL.
     * @param src The source file.
     * @returns {string|boolean} The stylesheet URL on success or false on failure.
     */
    static enqueueStylesheetAfter(plugin, url, src) {
        return PluginManager.enqueueStylesheet('After', plugin, url, src);
    }

    /**
     * Internal method to get a list of enqueued stylesheets.
     * @param pos The position.
     * @returns {[]} The list of stylesheets.
     */
    static getEnqueuedStylesheets(pos) {
        const listName = 'enqueuedStylesheets' + pos;
        if (PluginManager[listName] === undefined) {
            PluginManager[listName] = [];
            return [];
        }

        return PluginManager[listName];
    }

    /**
     * Gets all enqueued stylesheets that are loaded before other stylesheets.
     * @returns {*[]|*} The list of stylesheets.
     */
    static getEnqueuedStylesheetsBefore() {
        return this.getEnqueuedStylesheets('Before');
    }

    /**
     * Gets all enqueued stylesheets that are loaded after other stylesheets.
     * @returns {*[]|*} The list of stylesheets.
     */
    static getEnqueuedStylesheetsAfter() {
        return this.getEnqueuedStylesheets('After');
    }

    /**
     * Remove all enqueued stylesheets for the plugin.
     * @param {Plugin} plugin The plugin.
     */
    static removePluginEnqueuedStylesheets(plugin) {
        if (PluginManager.enqueuedStylesheetsBefore === undefined) {
            PluginManager.enqueuedStylesheetsBefore = [];
        }

        if (PluginManager.enqueuedStylesheetsAfter === undefined) {
            PluginManager.enqueuedStylesheetsAfter = [];
        }

        PluginManager.removeItems(PluginManager.enqueuedStylesheetsBefore, plugin);
        PluginManager.removeItems(PluginManager.enqueuedStylesheetsAfter, plugin);
    }

    /**
     * Register a resource for the plugin.
     * @param plugin The plugin.
     * @param url The resource URL.
     * @param src The resource source file.
     * @param mime_type The MIME type.
     * @returns {string|boolean} The resource URL or false on failure.
     */
    static addResource(plugin, url, src, mime_type) {
        if (PluginManager.resources === undefined) {
            PluginManager.resources = [];
        }

        if (PluginManager.registeredPlugins === undefined) {
            PluginManager.registeredPlugins = [];
            return false;
        }

        if (!PluginManager.registeredPlugins.hasOwnProperty(plugin.name)) {
            return false;
        }

        PluginManager.resources.push({
            plugin: plugin.name,
            url: url,
            src: path.normalize(
                process.env.PLUGINS_DIR + '/' + PluginManager.registeredPlugins[plugin.name] + '/' + src),
            mime_type: mime_type
        });

        return '/assets/plugins/' + plugin.name + '/' + url;
    }

    /**
     * Gets all plugin resources.
     * @returns {[]} The list of resources
     */
    static getResources() {
        if (PluginManager.resources === undefined) {
            PluginManager.resources = [];
            return [];
        }

        return PluginManager.resources;
    }

    /**
     * Remove all resources for the plugin.
     * @param {Plugin} plugin The plugin.
     */
    static removePluginResources(plugin) {
        if (PluginManager.resources === undefined) {
            PluginManager.resources = [];
        }

        PluginManager.removeItems(PluginManager.resources, plugin);
    }

    /**
     * Express middleware to handle sending script content for a URL.
     * @param req
     * @param res
     */
    static handleScriptRequest(req, res) {
        const plugin = req.params.plugin;
        const script = req.params.script;

        if (PluginManager.enqueuedScriptsBefore === undefined) {
            PluginManager.enqueuedScriptsBefore = [];
        }

        if (PluginManager.enqueuedScriptsAfter === undefined) {
            PluginManager.enqueuedScriptsAfter = [];
        }

        let scriptFound = false;

        const searchScripts = pos => {
            const listName = 'enqueuedScripts' + pos;
            Object.keys(PluginManager[listName]).forEach(key => {
                let scripts = PluginManager[listName][key];

                for (let i = 0; i < scripts.length; i++) {
                    if (scripts[i].plugin === plugin && scripts[i].url === script) {
                        scriptFound = true;

                        const data = PluginManager.readTextFile(scripts[i].src);

                        if (!data) {
                            res.status(404).json({
                                message: 'Script not found'
                            });
                        } else {
                            res.status(200).type('application/javascript').send(data);
                        }
                    }
                }
            });
        };

        searchScripts('Before');

        if (!scriptFound) {
            searchScripts('After');
        }

        if (!scriptFound) {
            res.status(404).json({
                message: 'Script not found'
            });
        }
    }

    /**
     * Express middleware to handle sending stylesheet content for a URL.
     * @param req
     * @param res
     */
    static handleStylesheetRequest(req, res) {
        const plugin = req.params.plugin;
        const url = req.params.stylesheet;

        if (PluginManager.enqueuedStylesheetsBefore === undefined) {
            PluginManager.enqueuedStylesheetsBefore = [];
        }

        if (PluginManager.enqueuedStylesheetsAfter === undefined) {
            PluginManager.enqueuedStylesheetsAfter = [];
        }

        let stylesheetFound = false;
        const searchStylesheets = pos => {
            const listName = 'enqueuedStylesheets' + pos;
            for (let i = 0; i < PluginManager[listName].length; i++) {
                const stylesheet = PluginManager[listName][i];
                if (stylesheet.plugin === plugin && stylesheet.url === url) {
                    stylesheetFound = true;
                    const data = PluginManager.readTextFile(stylesheet.src);

                    if (!data) {
                        res.status(404).json({
                            message: 'Stylesheet not found'
                        });
                    } else {
                        res.status(200).type('text/css').send(data);
                    }
                }
            }
        };

        searchStylesheets('Before');

        if (!stylesheetFound) {
            searchStylesheets('After');
        }

        if (!stylesheetFound) {
            res.status(404).json({
                message: 'Stylesheet not found'
            });
        }
    }

    /**
     * Express middleware to handle sending resource content for a URL.
     * @param req
     * @param res
     */
    static handleResourceRequest(req, res) {
        const plugin = req.params.plugin;
        const resourceUrl = req.params.resource;

        if (PluginManager.resources === undefined) {
            PluginManager.resources = [];
        }

        let resourceFound = false;
        for (let i = 0; i < PluginManager.resources.length; i++) {
            const resource = PluginManager.resources[i];
            if (resource.plugin === plugin && resource.url === resourceUrl) {
                resourceFound = true;

                let mimeType = 'text/plain';
                if (resource.mime_type !== undefined) {
                    mimeType = resource.mime_type;
                }

                res.status(200).type(mimeType).sendFile(path.normalize(resource.src));
            }
        }

        if (!resourceFound) {
            res.status(404).json({
                message: 'Resource not found'
            });
        }
    }

    /**
     * Returns the contents of the text file.
     * @param {string} src The location of the file.
     * @return {string|boolean} Returns the file contents or false on failure.
     */
    static readTextFile(src) {
        try {
            return fs.readFileSync(path.normalize(src), 'utf8');
        } catch (e) {
            Logger.error(e);
            return false;
        }
    }

    /**
     * Remove items from a list.
     * @param {[]} list The list.
     * @param {Plugin} plugin The plugin.
     */
    static removeItems(list, plugin) {
        let indexesToRemove = [];

        for (let i = 0; i < list.length; i++) {
            if (list[i].plugin === plugin.name) {
                indexesToRemove.push(i);
            }
        }

        for (let i = 0; i < indexesToRemove.length; i++) {
            let index = indexesToRemove[i] - i;
            list.splice(index, 1);
        }
    }

    /**
     * Calls all event listeners that are registered for that event.
     * @param {string} event The event.
     * @param {[]} parameters Additional parameters to be passed to the callback.
     */
    static broadcastEvent(event, ...parameters) {
        if (PluginManager.registeredEventListeners === undefined) {
            PluginManager.registeredEventListeners = [];
            return;
        }

        if (!PluginManager.registeredEventListeners.hasOwnProperty(event)) {
            return;
        }

        for (let i = 0; i < PluginManager.registeredEventListeners[event].length; i++) {
            PluginManager.registeredEventListeners[event][i].callback(event, ...parameters);
        }
    }

    /**
     * This method is called when a message is received on the `plugin-manager` channel of the Redis message broker.
     * The message is parsed and the relevant action will be performed.
     * @param {string} message The message that was received.
     */
    static handleMessage(message) {
        if (message.startsWith('callOnEnable:')) {
            PluginManager.callOnEnable(message.substring(13));
        } else if (message.startsWith('callOnDisable:')) {
            PluginManager.callOnDisable(message.substring(14));
        } else if (message.startsWith('callOnActivate:')) {
            if (PluginManager.activated === undefined) {
                PluginManager.activated = [];
            }

            const target = message.substring(15);

            if (PluginManager.activated.hasOwnProperty(target)) {
                if (!PluginManager.activated[target]) {
                    PluginManager.activated[target] = true;
                    PluginManager.callOnActivate(target);
                }
            } else {
                PluginManager.activated[target] = true;
                PluginManager.callOnActivate(target);
            }
        } else if (message.startsWith('callOnDeactivate:')) {
            PluginManager.callOnDeactivate(message.substring(17));
        }
    }

    /**
     * Called when a plugin tries to call a restricted method. It logs a security warning and deactivates or disables
     * the plugin depending on the `security.plugin_calling_restricted_method_action` configuration option.
     * @param {string} methodName The name of the restricted method that the plugin tried to call.
     * @param {string} pluginName The name of the plugin.
     */
    static restrictedMethodAction(methodName, pluginName) {
        Logger.securityWarning('Plugin ' + pluginName + ' trying to call restricted method: ' + methodName);

        let action = Config.getInstance().getOption('security.plugin_calling_restricted_method_action');
        // FIXME: Needs testing
        if (action !== null) {
            if (action === 'deactivate') {
                PluginManager.deactivatePlugin(pluginName);
            } else if (action === 'disable') {
                PluginManager.deactivatePlugin(pluginName);
                PluginManager.disablePlugin(pluginName);
            }
        }
    }
};

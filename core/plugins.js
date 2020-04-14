/*
Copyright (C) 2019-2020 Bester Intranet
*/

const fs = require('fs');
const path = require('path');

const db = require('../db/db');
const redis = require('../db/redis');
const Util = require('../core/util');

module.exports.Plugin = class Plugin {
    static onEnable() {
        
    }

    static onDisable() {

    }

    static onActivate() {

    }

    static onDeactivate() {

    }

    static getPluginManager() {
        return module.exports.PluginManager;
    }
}

module.exports.PluginManager = class PluginManager {
    static handleMessage(message) {
        if(message.startsWith('callOnEnable:')) {
            this.callOnEnable(message.substring(13));
        } else if(message.startsWith('callOnDisable:')) {
            this.callOnDisable(message.substring(14));
        } else if(message.startsWith('callOnActivate:')) {
            if(this.activated === undefined) {
                this.activated = [];
            }

            var target = message.substring(15);

            if(this.activated.hasOwnProperty(target)) {
                if(!this.activated[target]) {
                    this.activated[target] = true;
                    this.callOnActivate(target);
                }
            } else {
                this.activated[target] = true;
                this.callOnActivate(target);
            }
        } else if(message.startsWith('callOnDeactivate:')) {
            this.callOnDeactivate(message.substring(17));
        }
    }

    static getEnabledPlugins() {
        return new Promise((resolve, reject) => {
            const connection = db.getConnection();

            connection.connect();

            connection.query("SELECT * FROM enabled_plugins",
            (error, results, fields) => {
                connection.end();

                if (error) reject(error);

                if(results.length > 0) {
                    var client = redis.getConnection();

                    Object.keys(results).forEach(key => {
                        var data = this.readPluginManifest(results[key].manifest_path);

                        if(!data) {
                            console.error("Cannot read manifest file: " + results[key].manifest_path);
                        } else {
                            if(!data.hasOwnProperty('main')) {
                                console.error("Manifest file: " + results[key].manifest_path + ' does not have required "main" attribute');
                            } else if(!data.hasOwnProperty('mainClass')) {
                                console.error("Manifest file: " + results[key].manifest_path + ' does not have required "mainClass" attribute');
                            } else {
                                client.sadd('plugins', results[key].id);
                                client.hmset('plugin:' + results[key].id, 
                                    'name', results[key].name,
                                    'manifest_path', results[key].manifest_path,
                                    'main', data.main,
                                    'mainClass', data.mainClass);
                            }
                        }
                    });
                }

                resolve(true);
            });
        });
    }

    static readPluginManifest(manifest_path) {
        try {
            const data = fs.readFileSync(path.normalize(process.env.PLUGINS_DIR + '/' + manifest_path), 'utf8');
            try {
                return JSON.parse(data);
            } catch (e) {
                return false;
            }
        } catch (e) {
            console.log(e);
            return false;
        }
    }

    static getAllPlugins() {
        var directories = fs.readdirSync(process.env.PLUGINS_DIR, {
            withFileTypes: true
        }).filter(dirent => dirent.isDirectory)
        .map(direct => direct.name);
    }

    static enablePlugin(id) {
        if(Util.getCallerFile().startsWith(process.env.PLUGINS_DIR)) {
            return new Promise((resolve, reject) => {
                reject("enablePlugin() cannot be called from a plugin");
            });
        }

        return new Promise((resolve, reject) => {
            var data = this.readPluginManifest(id + '/manifest.json');

            if(!data) {
                reject("Cannot read manifest file: " + id + '/manifest.json');
            } else {
                if(!data.hasOwnProperty('main')) {
                    reject("Manifest file: " + id + '/manifest.json does not have required "main" attribute');
                } else if(!data.hasOwnProperty('mainClass')) {
                    reject("Manifest file: " + id + '/manifest.json does not have required "mainClass" attribute');
                } else if(!data.hasOwnProperty('name')) {
                    reject("Manifest file: " + id + '/manifest.json does not have required "name" attribute');
                } else {
                    // Add to database
                    const connection = db.getConnection('modify');
                    connection.connect();

                    connection.query("INSERT INTO enabled_plugins VALUES("
                        + connection.escape(id) + ", "
                        + connection.escape(data.name) + ", "
                        + connection.escape(id + "/manifest.json") + ")",
                    (error, results, fields) => {
                        connection.end();

                        if (error) reject(error);

                        var client = redis.getConnection();
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

    static disablePlugin(id) {
        if(Util.getCallerFile().startsWith(process.env.PLUGINS_DIR)) {
            return new Promise((resolve, reject) => {
                reject("disablePlugin() cannot be called from a plugin");
            });
        }

        return new Promise((resolve, reject) => {
            // Remove from database
            const connection = db.getConnection('delete');
            connection.connect();

            connection.query("DELETE FROM enabled_plugins WHERE id = " + connection.escape(id),
            (error, results, fields) => {
                connection.end();

                if (error) reject(error);

                var client = redis.getConnection();
                client.hget('plugin:' + id, 'main', (err, res) => {
                    var main = res;

                    client.srem('plugins', id);
                    client.del('plugin:' + id);

                    client.publish('plugin-manager', 'callOnDisable:'+ id + '/' + main);
                });
                
            });
        });
    }

    static activateEnabledPlugins() {
        if(Util.getCallerFile().startsWith(process.env.PLUGINS_DIR)) {
            console.error("activateEnabledPlugins() cannot be called from a plugin");
            return false;
        }

        var client = redis.getConnection();

        client.smembers('plugins', (err, res) => {
            if(err) {
                return false;
            }

            for(var i = 0; i < res.length; i++) {
                let id = res[i];

                client.hget('plugin:' + id, 'main', (err, res) => {
                    if(err) {
                        return false;
                    }

                    var main = res;

                    client.publish('plugin-manager', 'callOnActivate:'+ id + '/' + main);
                });
            }
        });
    }

    static activatePlugin(id) {
        if(Util.getCallerFile().startsWith(process.env.PLUGINS_DIR)) {
            console.error("activatePlugins() cannot be called from a plugin");
            return false;
        }

        var client = redis.getConnection();
        client.hget('plugin:' + id, 'main', (err, res) => {
            if(err) {
                return false;
            }

            var main = res;
            client.publish('plugin-manager', 'callOnActivate:'+ id + '/' + main);
        });
    }

    static deactivatePlugin(id) {
        if(Util.getCallerFile().startsWith(process.env.PLUGINS_DIR)) {
            console.error("deactivatePlugins() cannot be called from a plugin");
            return false;
        }

        var client = redis.getConnection();
        client.hget('plugin:' + id, 'main', (err, res) => {
            if(err) {
                return false;
            }

            var main = res;
            client.publish('plugin-manager', 'callOnDeactivate:'+ id + '/' + main);
        });
    }

    static callOnEnable(main) {
        if(Util.getCallerFile().startsWith(process.env.PLUGINS_DIR)) {
            console.error("callOnEnable() cannot be called from a plugin");
            return false;
        }

        const plugin = require(path.normalize(process.env.PLUGINS_DIR + '/' + main));
        plugin.onEnable();
    }

    static callOnDisable(main) {
        if(Util.getCallerFile().startsWith(process.env.PLUGINS_DIR)) {
            console.error("callOnDisable() cannot be called from a plugin");
            return false;
        }

        const plugin = require(path.normalize(process.env.PLUGINS_DIR + '/' + main));
        plugin.onDisable();
    }

    static callOnActivate(main) {
        if(Util.getCallerFile().startsWith(process.env.PLUGINS_DIR)) {
            console.error("callOnActivate() cannot be called from a plugin");
            return false;
        }

        const plugin = require(path.normalize(process.env.PLUGINS_DIR + '/' + main));
        plugin.onActivate();
    }

    static callOnDeactivate(main) {
        if(Util.getCallerFile().startsWith(process.env.PLUGINS_DIR)) {
            console.error("callOnDeactivate() cannot be called from a plugin");
            return false;
        }

        const plugin = require(path.normalize(process.env.PLUGINS_DIR + '/' + main));
        plugin.onDeactivate();

        if(!this.registeredPlugins === undefined) {
            this.registeredPlugins = [];
        }

        if(this.registeredPlugins.hasOwnProperty(plugin.name)) {
            delete this.registeredPlugins[plugin.name];
        }

        this.removePluginEventListeners(plugin);
        this.removePluginEnqueuedScripts(plugin);
    }

    static registerPlugin(plugin, id) {
        if(this.registeredPlugins === undefined) {
            this.registeredPlugins = [];
        }

        var data = this.readPluginManifest(id + '/manifest.json');

        if(!data) {
            return false;
        } else {
            if(!data.hasOwnProperty('mainClass')) {
                return false;
            } else {
                if(plugin.name == data.mainClass) {
                    this.registeredPlugins[plugin.name] = id;
                } else {
                    return false;
                }
            }
        }
    }

    static addEventListener(plugin, event, callback) {
        if(this.registeredEventListeners === undefined) {
            this.registeredEventListeners = [];
        }

        if(!this.registeredEventListeners.hasOwnProperty(event)) {
            this.registeredEventListeners[event] = [];
        }

        this.registeredEventListeners[event].push({
            plugin: plugin.name,
            callback: callback
        });
    }

    static broadcastEvent(event, ...parameters) {
        if(this.registeredEventListeners === undefined) {
            this.registeredEventListeners = [];
            return;
        }

        if(!this.registeredEventListeners.hasOwnProperty(event)) {
            return;
        }

        for(var i = 0; i < this.registeredEventListeners[event].length; i++) {
            this.registeredEventListeners[event][i].callback(event, ...parameters);
        }
    }

    static removePluginEventListeners(plugin) {
        if(this.registeredEventListeners === undefined) {
            this.registeredEventListeners = [];
            return;
        }

        Object.keys(this.registeredEventListeners).forEach(key => {
            let callbacks = this.registeredEventListeners[key];

            let indexesToRemove = []

            for(let i = 0; i < callbacks.length; i++) {
                if(callbacks[i].plugin == plugin.name) {
                    indexesToRemove.push(i);
                }
            }

            for(let i = 0; i < indexesToRemove.length; i++) {
                let index = indexesToRemove[i] - i;
                callbacks.splice(index, 1);
            }
        });
    }

    static enqueueScriptBefore(plugin, page, url, src, async = true) {
        if(this.enqueuedScriptsBefore === undefined) {
            this.enqueuedScriptsBefore = [];
        }

        if(!this.enqueuedScriptsBefore.hasOwnProperty(page)) {
            this.enqueuedScriptsBefore[page] = [];
        }

        if(!this.registeredPlugins === undefined) {
            this.registeredPlugins = [];
            return false;
        }

        if(!this.registeredPlugins.hasOwnProperty(plugin.name)) {
            return false;
        }

        this.enqueuedScriptsBefore[page].push({
            plugin: plugin.name,
            url: url,
            src: path.normalize(process.env.PLUGINS_DIR + '/' + this.registeredPlugins[plugin.name] + '/' + src),
            async: async
        });
    }

    static enqueueScriptAfter(plugin, page, url, src, async = true) {
        if(this.enqueuedScriptsAfter === undefined) {
            this.enqueuedScriptsAfter = [];
        }

        if(!this.enqueuedScriptsAfter.hasOwnProperty(page)) {
            this.enqueuedScriptsAfter[page] = [];
        }

        if(!this.registeredPlugins === undefined) {
            this.registeredPlugins = [];
            return false;
        }

        if(!this.registeredPlugins.hasOwnProperty(plugin.name)) {
            return false;
        }

        this.enqueuedScriptsAfter[page].push({
            plugin: plugin.name,
            url: url,
            src: path.normalize(process.env.PLUGINS_DIR + '/' + this.registeredPlugins[plugin.name] + '/' + src),
            async: async
        });
    }

    static getEnqueuedScriptsBefore(page) {
        if(this.enqueuedScriptsBefore === undefined) {
            this.enqueueScriptBefore = [];
            return [];
        }

        if(!this.enqueuedScriptsBefore.hasOwnProperty(page)) {
            return [];
        }

        return this.enqueuedScriptsBefore[page];
    }

    static getEnqueuedScriptsAfter(page) {
        if(this.enqueuedScriptsAfter === undefined) {
            this.enqueuedScriptsAfter = [];
            return [];
        }

        if(!this.enqueuedScriptsAfter.hasOwnProperty(page)) {
            return [];
        }

        return this.enqueuedScriptsAfter[page];
    }

    static readScriptFile(src) {
        try {
            const data = fs.readFileSync(path.normalize(src), 'utf8');
            return data;
        } catch (e) {
            console.log(e);
            return false;
        }
    }

    static handleScriptRequest(req, res, next) {
        const plugin = req.params.plugin;
        const script = req.params.script;

        if(PluginManager.enqueuedScriptsBefore === undefined) {
            PluginManager.enqueuedScriptsBefore = [];
        }

        if(PluginManager.enqueuedScriptsAfter === undefined) {
            PluginManager.enqueuedScriptsAfter = [];
        }

        var scriptFound = false;
        Object.keys(PluginManager.enqueuedScriptsBefore).forEach(key => {
            let scripts = PluginManager.enqueuedScriptsBefore[key];

            for(let i = 0; i < scripts.length; i++) {
                if(scripts[i].plugin == plugin && scripts[i].url == script) {
                    scriptFound = true;

                    const data = PluginManager.readScriptFile(scripts[i].src);

                    if(!data) {
                        res.status(404).json({
                            message: "Script not found"
                        });
                    } else {
                        res.status(200).type('application/javascript').send(data);
                    }
                }
            }
        });

        if(!scriptFound) {
            Object.keys(PluginManager.enqueuedScriptsAfter).forEach(key => {
                let scripts = PluginManager.enqueuedScriptsAfter[key];

                for(let i = 0; i < scripts.length; i++) {
                    if(scripts[i].plugin == plugin && scripts[i].url == script) {
                        scriptFound = true;

                        const data = PluginManager.readScriptFile(scripts[i].src);

                        if(!data) {
                            res.status(404).json({
                                message: "Script not found"
                            });
                        } else {
                            res.status(200).type('application/javascript').send(data);
                        }
                    }
                }
            });
        }

        if(!scriptFound) {
            res.status(404).json({
                message: "Script not found"
            });
        }
    }

    static removePluginEnqueuedScripts(plugin) {
        if(this.enqueuedScriptsBefore === undefined) {
            this.enqueuedScriptsBefore = [];
        }

        if(this.enqueuedScriptsAfter === undefined) {
            this.enqueuedScriptsAfter = [];
        }

        Object.keys(this.enqueuedScriptsBefore).forEach(key => {
            let scripts = this.enqueuedScriptsBefore[key];

            let indexesToRemove = [];

            for(let i = 0; i < scripts.length; i++) {
                if(scripts[i].plugin == plugin.name) {
                    indexesToRemove.push(i);
                }
            }

            for(let i = 0; i < indexesToRemove.length; i++) {
                let index = indexesToRemove[i] - i;
                scripts.splice(index, 1);
            }
        });

        Object.keys(this.enqueuedScriptsAfter).forEach(key => {
            let scripts = this.enqueuedScriptsAfter[key];

            let indexesToRemove = [];

            for(let i = 0; i < scripts.length; i++) {
                if(scripts[i].plugin == plugin.name) {
                    indexesToRemove.push(i);
                }
            }

            for(let i = 0; i < indexesToRemove.length; i++) {
                let index = indexesToRemove[i] - i;
                scripts.splice(index, 1);
            }
        });
    }
}
/*
 * Copyright (C) 2019 - 2020 Bester Intranet
 */

const { PluginManager } = require('./pluginmanager');

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
        return PluginManager;
    }
};
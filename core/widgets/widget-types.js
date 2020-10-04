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
const { Sanitizer } = require('../sanitizer');
const { WidgetType } = require('./widget-type');
const { Widget } = require('./widget');

const BUILT_IN_TYPES = [
    new WidgetType('weather', 'Weather', '/scripts/home/widgets/weather.js',
        '%static_domain%/assets/images/placeholder.png',
        'weatherWidget',
        'weatherProperties', 'parseWeatherProperties'),
    new WidgetType('news', 'News', '/scripts/home/widgets/news.js', '%static_domain%/assets/images/placeholder.png',
        'newsWidget', 'newsProperties',
        'parseNewsProperties'),
    new WidgetType('web_feed', 'Web Feed', '/scripts/home/widgets/web-feed.js',
        '%static_domain%/assets/images/placeholder.png', 'webFeedWidget',
        'webFeedProperties', 'parseWebFeedProperties')
];

/**
 * The `WidgetTypes` class stores the widget types and the scripts associated with them.
 * @type {WidgetTypes}
 */
module.exports.WidgetTypes = class WidgetTypes {
    static widgetTypes = BUILT_IN_TYPES;

    /**
     * Registers a widget type.
     * @param {WidgetType} widget_type The widget type.
     */
    static registerWidgetType(widget_type) {
        this.widgetTypes.push(widget_type);
    }

    /**
     * Gets all the registered widget scripts.
     * @returns {[string]} A string array of script URLs.
     */
    static getWidgetScripts() {
        let scripts = [];
        for (let i = 0; i < this.widgetTypes.length; i++) {
            const { script_url } = this.widgetTypes[i];
            if (script_url === undefined) {
                continue;
            }

            const scriptUrl = Sanitizer.whitespace(Sanitizer.ascii(Sanitizer.string(script_url)));
            if (scriptUrl === false) {
                continue;
            }

            scripts.push(scriptUrl);
        }

        return scripts;
    }

    /**
     * Gets all the registered widget types.
     * @returns {[WidgetType]} The registered widget types.
     */
    static getWidgetTypes(staticProtocol, staticDomain) {
        let types = [];

        if (staticDomain === undefined) {
            this.widgetTypes.forEach(widget_type => {
                types.push(widget_type);
            });
        } else {
            this.widgetTypes.forEach(widget_type => {
                let { name, title, script_url, icon_url, methods } = widget_type;
                types.push({
                    name: name,
                    title: title,
                    script_url: script_url,
                    icon_url: icon_url.toString().replace(/%static_domain%/g, staticProtocol + staticDomain),
                    methods: methods
                });
            });
        }

        return types;
    }
};

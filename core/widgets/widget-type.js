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
const { Widget } = require('./widget');

/**
 * `WidgetType` class.
 * @type {WidgetType}
 */
module.exports.WidgetType = class WidgetType {
    constructor(name, title, script_url, icon_url, get_content, get_properties, parse_properties) {
        this.name = name;
        this.title = title;
        this.script_url = script_url;
        this.icon_url = icon_url;
        this.methods = {
            get_content: get_content,
            get_properties: get_properties,
            parse_properties: parse_properties
        };
    }
};

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

const widget = (function () {
    return {
        widgetMethods: {},
        getContent: function (type, data, container, widgetTypesPromise) {
            if (widgetTypesPromise !== undefined) {
                this.widgetTypesPromise = widgetTypesPromise;
            }

            if (this.widgetTypesPromise === undefined) {
                container.innerHTML = '<p>Unknown widget type</p>';
            }

            this.widgetTypesPromise.then(async function (res) {
                if (res.ok) {
                    await res.clone().json().then(function (json) {
                        let success = false;
                        let content = '<p>Unknown widget type</p>';

                        for (let i = 0; i < json.widget_types.length; i++) {
                            const widgetType = json.widget_types[i];
                            if (widgetType.name !== type) {
                                continue;
                            }

                            if (!widgetType.hasOwnProperty('methods')) {
                                content = '';
                                break;
                            }

                            if (!widgetType.methods.hasOwnProperty('get_content')) {
                                content = '';
                                break;
                            }

                            if (!widget.widgetMethods.hasOwnProperty(widgetType.methods.get_content)) {
                                content = '';
                                break;
                            }

                            widget.widgetMethods[widgetType.methods.get_content](data, container);
                            success = true;
                            break;
                        }

                        if (!success) {
                            container.innerHTML = content;
                        }
                    });
                } else {
                    container.innerHTML = '<p>Error getting widget content</p>';
                }
            }).catch(function () {
                container.innerHTML = '<p>Error getting widget content</p>';
            });
        },
        parseProperties: function (type, properties, html, widgetTypesPromise) {
            widgetTypesPromise.then(async function (res) {
                if (res.ok) {
                    await res.clone().json().then(function (json) {
                        let properties = {};

                        for (let i = 0; i < json.widget_types.length; i++) {
                            const widgetType = json.widget_types[i];
                            if (widgetType.name !== type) {
                                continue;
                            }

                            if (!widgetType.hasOwnProperty('methods')) {
                                break;
                            }

                            if (!widgetType.methods.hasOwnProperty('parse_properties')) {
                                break;
                            }

                            if (!widget.widgetMethods.hasOwnProperty(widgetType.methods.parse_properties)) {
                                break;
                            }

                            properties = widget.widgetMethods[widgetType.methods.parse_properties](properties, html);
                            break;
                        }

                        return {};
                    });
                } else {
                    return {};
                }
            }).catch(function () {
                return {};
            });
        }
    };
}());

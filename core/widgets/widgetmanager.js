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
 * The `WidgetManager` class stores the widgets and layout information associated with a user.
 * @type {WidgetManager}
 */
module.exports.WidgetManager = class WidgetManager {

    /**
     * Constructs a new WidgetManager object.
     * @param user_id The user ID.
     * @param layout The JSON layout data.
     */
    constructor(user_id, layout) {
        this.user_id = user_id;
        this.layout = layout;
    }

    /**
     * Loads the widgets associated with the user.
     * @return {Promise<boolean>|Promise<Error>}
     */
    loadWidgets() {
        return new Promise((resolve, reject) => {
            if (this.user_id === undefined) {
                reject('User ID not set');
                return;
            }

            const connection = mysql.getConnection();
            connection.connect();

            connection.query(
                'SELECT layout FROM widget_layouts WHERE user_id = UNHEX(' + connection.escape(this.user_id) + ')',
                (error, results) => {
                    connection.end();

                    if (error) {
                        reject(error);
                        return;
                    }

                    if (results.length > 0) {
                        try {
                            this.layout = JSON.parse(results[0].layout);
                        } catch {
                            this.layout = undefined;
                        }

                        resolve(true);
                    } else {
                        reject('User does not have any layout information stored.');
                    }
                });
        });
    }

    /**
     * Save the widget layout for the user.
     * @return {Promise<boolean>|Promise<Error>}
     */
    saveLayout() {
        return new Promise((resolve, reject) => {
            if (this.user_id === undefined) {
                reject('User ID not set');
                return;
            }

            const connection = mysql.getConnection('modify');
            connection.connect();

            connection.query('SELECT COUNT(*) AS UserCount FROM widget_layouts'
                + ' WHERE user_id = UNHEX(' + connection.escape(this.user_id) + ')',
                (error, results, fields) => {
                    if (error) {
                        connection.end();
                        reject(error);
                        return;
                    }
                    const { UserCount } = results[0];
                    if (UserCount > 0) {
                        // Update existing layout
                        connection.query('UPDATE widget_layouts'
                            + ' SET layout = ' + connection.escape(JSON.stringify(this.layout))
                            + ' WHERE user_id = UNHEX(' + connection.escape(this.user_id) + ')',
                            (error) => {
                                connection.end();

                                if (error) {
                                    reject(error);
                                    return;
                                }

                                resolve(true);
                            });
                    } else {
                        // Insert new layout
                        connection.query('INSERT INTO widget_layouts VALUES('
                            + 'UNHEX(' + connection.escape(this.user_id) + '), '
                            + connection.escape(JSON.stringify(this.layout)) + ')',
                            (error) => {
                                connection.end();

                                if (error) {
                                    reject(error);
                                    return;
                                }

                                resolve(true);
                            });
                    }
                });
        });
    }

    /**
     * Gets all the widgets in the layout as objects.
     * @return {Promise<Array>|Promise<Error>}
     */
    getWidgets() {
        return new Promise((resolve, reject) => {
            if (this.user_id === undefined) {
                reject('User ID not set');
                return;
            }

            if (this.layout === undefined) {
                reject('Layout not set');
                return;
            }

            if (this.layout.hasOwnProperty('widgets')) {
                const widgets = [];

                this.layout.widgets.forEach(widget => {
                    const widgetObj = new Widget(widget.widget_id, this.user_Id);
                    widgets.push(widgetObj);
                });

                resolve(widgets);
            } else {
                reject('Layout does not have a widgets array');
            }
        });
    }

    /**
     * Gets all the widgets in the database, even if they are not in the layout
     * @return {Promise<Array>|Promise<Error>}
     */
    getAllWidgets() {
        return new Promise((resolve, reject) => {
            if (this.user_id === undefined) {
                reject('User ID not set');
                return;
            }

            const connection = mysql.getConnection();
            connection.connect();

            connection.query('SELECT HEX(widget_id) AS widget_id FROM widgets'
                + ' WHERE user_id = UNHEX(' + connection.escape(this.user_id) + ')',
                (error, results, fields) => {
                    connection.end();

                    if (error) {
                        reject(error);
                        return;
                    }

                    const widgets = [];
                    results.forEach(result => {
                        const widget = new Widget(result.widget_id);
                        widgets.push(widget);
                    });

                    resolve(widgets);
                });
        });
    }

    /**
     * Set up the default layout for a user.
     * @returns {boolean} True on success or false on failure.
     */
    prepareUser() {
        if (this.user_id === undefined) {
            return false;
        }

        if (this.layout === undefined || this.layout === null) {
            this.layout = {};
            this.layout.widgets = [];

            return true;
        }

        if (!this.layout.hasOwnProperty('widgets')) {
            this.layout.widgets = [];
            return true;
        }

        return true;
    }

    /**
     * Adds a widget to the layout.
     * @param widget The widget to add.
     * @param height The height of the widget.
     * @param position The position of the widget. Undefined to add at the end.
     * @returns {boolean} True on success or false on failure.
     */
    addWidget(widget, height, position) {
        if (this.user_id === undefined) {
            return false;
        }

        if (!this.prepareUser()) {
            return false;
        }

        if (widget === undefined || height === undefined) {
            return false;
        }

        // Get the highest position
        if (position === undefined) {
            position = 0;

            this.layout.widgets.forEach(widget => {
                if (widget.position > position) {
                    position = widget.position;
                }
            });

            position++;
        }

        this.layout.widgets.push({
            widget_id: widget.widget_id.toUpperCase(),
            position: parseInt(position),
            height: parseInt(height)
        });

        return true;
    }

    /**
     * Deletes a widget from the layout.
     * @param widget_id The widget ID to delete.
     * @returns {boolean} True on success or false on failure.
     */
    deleteWidget(widget_id) {
        if (this.user_id === undefined) {
            return false;
        }

        if (!this.prepareUser()) {
            return false;
        }

        if (widget_id === undefined) {
            return false;
        }

        let position = 0;
        this.layout.widgets.forEach(widget => {
            if (widget.widget_id === widget_id) {
                this.layout.widgets.splice(position, 1);
            }
            position++;
        });

        return true;
    }

    /**
     * Updates a widget in the layout.
     * @param widget_id The widget ID.
     * @param height The new height.
     * @param position The new position.
     * @returns {boolean} True on success or false on failure.
     */
    updateWidget(widget_id, height, position) {
        if (this.user_id === undefined) {
            return false;
        }

        if (!this.prepareUser()) {
            return false;
        }

        if (widget_id === undefined) {
            return false;
        }

        for (let i = 0; i < this.layout.widgets.length; i++) {
            const widget = this.layout.widgets[i];

            if (widget.widget_id === widget_id) {
                if (position) {
                    widget.position = position;
                }

                if (height) {
                    widget.height = height;
                }
            }
        }

        return true;
    }

    /**
     * Gets a widget from the layout as an object.
     * @param widget_id The widget Id.
     * @returns {Widget|boolean} The widget object or false on failure.
     */
    getWidget(widget_id) {
        if (this.user_id === undefined) {
            return false;
        }

        if (!this.prepareUser()) {
            return false;
        }

        if (widget_id === undefined) {
            return false;
        }

        for (let i = 0; i < this.layout.widgets.length; i++) {
            const widget = this.layout.widgets[i];

            if (widget.widget_id === widget_id) {
                return new Widget(widget.widget_id, this.user_id);
            }
        }

        return false;
    }

};

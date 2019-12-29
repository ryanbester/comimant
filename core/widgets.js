/*
Copyright (C) 2019 Bester Intranet
*/

const crypto = require('crypto');
const mysql = require('mysql');

const db = require('../db/db');

module.exports.Widget = class Widget {
    constructor(widget_id, user_id, type, title, data) {
        this.widget_id = widget_id;
        this.user_id = user_id;
        this.type = type;
        this.title = title;
        this.data = data;
    }

    loadInfo() {
        return new Promise((resolve, reject) => {
            // Check if widget ID is set
            if (this.widget_id === undefined) {
                reject("Widget ID not set");
            }

            const connection = db.getConnection();

            connection.connect();

            connection.query("SELECT HEX(user_id) AS user_id, type, title, data FROM widgets WHERE widget_id = UNHEX(" + connection.escape(this.widget_id) + ")",
            (error, results, fields) => {
                connection.end();

                if (error) reject(error);

                if(results.length > 0) {
                    this.user_id = results[0].user_id;
                    this.type = results[0].type;
                    this.title = results[0].title;
                    this.data = JSON.parse(results[0].data);

                    resolve(true);
                } else {
                    reject(false);
                }
            });
        });
    }

    saveWidget() {
        return new Promise((resolve, reject) => {
            if(this.widget_id === undefined) {
                reject("Widget ID not set");
            }

            const connection = db.getConnection('modify');

            connection.connect();

            connection.query("SELECT COUNT(*) AS WidgetCount FROM widgets WHERE widget_id = UNHEX(" + connection.escape(this.widget_id) + ")",
            (error, results, fields) => {
                if(error) {
                    connection.end();
                    reject(error);
                } else {
                    if(results[0].WidgetCount > 0) {
                        connection.query("UPDATE widgets "
                        + "SET user_id = UNHEX(" + connection.escape(this.user_id) + "), "
                        + "type = " + connection.escape(this.type) + ", "
                        + "title = " + connection.escape(this.title) + ", "
                        + "data = " + connection.escape(JSON.stringify(this.data))
                        + " WHERE widget_id = UNHEX(" + connection.escape(this.widget_id) + ")",
                        (error, results, fields) => {
                            connection.end();

                            if (error) reject(error);

                            resolve(true);
                        });
                    } else {
                        connection.query("INSERT INTO widgets VALUES("
                        + "UNHEX(" + connection.escape(this.widget_id) + "), "
                        + "UNHEX(" + connection.escape(this.user_id) + "), "
                        + connection.escape(this.type) + ", "
                        + connection.escape(this.title) + ", "
                        + connection.escape(JSON.stringify(this.data)) + ")",
                        (error, results, fields) => {
                            connection.end();

                            if (error) reject(error);

                            resolve(true);
                        });
                    }
                }
            });
        });
    }

    deleteWidget() {
        return new Promise((resolve, reject) => {
            if(this.widget_id === undefined) {
                reject("Widget ID not set");
            }

            const connection = db.getConnection('delete');

            connection.connect();

            connection.query("DELETE FROM widgets WHERE widget_id = UNHEX(" + connection.escape(this.widget_id) + ")",
            (error, results, fields) => {
                connection.end();

                if (error) reject(error);

                resolve(true);
            });
        });
    }

    static generateWidgetId() {
        return new Promise((resolve, reject) => {
            var id = crypto.randomBytes(16).toString('hex');

            const checkID = idFound => {
                return new Promise((resolve, reject) => {
                    const connection = db.getConnection();

                    connection.connect();

                    connection.query("SELECT COUNT(*) AS IDCount FROM widgets WHERE widget_id = UNHEX(" + connection.escape(id) + ")",
                    (error, results, fields) => {
                        connection.end();

                        if (error) reject(error);

                        if(results[0].IDCount > 0) {
                            id = crypto.randomBytes(16).toString('hex');
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                    });
                });
            }

            ((data, condition, action) => {
                var whilst = data => {
                    return condition(data) ? action(data).then(whilst) : Promise.resolve(data);
                }

                return whilst(data);
            })(true, idFound => idFound, checkID).then(idFound => {
                resolve(id);
            });
        });
    }
}

module.exports.WidgetManager = class WidgetManager {
    constructor(user_id, layout) {
        this.user_id = user_id;
        this.layout = layout;
    }

    /**
     * Load the widget layout from the database
     */
    loadWidgets() {
        return new Promise((resolve, reject) => {
            if(this.user_id === undefined) {
                reject("User ID not set");
            }

            const connection = db.getConnection();

            connection.connect();

            connection.query("SELECT layout FROM widget_layouts WHERE user_id = UNHEX(" + connection.escape(this.user_id) + ")",
            (error, results, fields) => {
                connection.end();

                if (error) reject(error);

                if (results.length > 0) {
                    try {
                        this.layout = JSON.parse(results[0].layout);
                    } catch {
                        this.layout = undefined;
                    }

                    resolve(true);
                } else {
                    reject(false);
                }
            });
        });
    }

    /**
     * Save the widget layout to the database
     */
    saveLayout() {
        return new Promise((resolve, reject) => {
            if(this.user_id === undefined) {
                reject("User ID not set");
            }

            const connection = db.getConnection('modify');

            connection.connect();

            connection.query("SELECT COUNT(*) AS UserCount FROM widget_layouts WHERE user_id = UNHEX(" + connection.escape(this.user_id) + ")",
            (error, results, fields) => {
                if(error) {
                    connection.end();
                    reject(error);
                } else {
                    if(results[0].UserCount > 0) {
                        connection.query("UPDATE widget_layouts "
                        + "SET layout = " + connection.escape(JSON.stringify(this.layout))
                        + " WHERE user_id = UNHEX(" + connection.escape(this.user_id) + ")",
                        (error, results, fields) => {
                            connection.end();

                            if (error) reject(error);

                            resolve(true);
                        });
                    } else {
                        connection.query("INSERT INTO widget_layouts VALUES("
                        + "UNHEX(" + connection.escape(this.user_id) + "),"
                        + connection.escape(JSON.stringify(this.layout)) + ")",
                        (error, results, fields) => {
                            connection.end();

                            if (error) reject(error);

                            resolve(true);
                        });
                    }
                }
            });
        });
    }

    /**
     * Get all the widgets in the layout as objects
     */
    getWidgets() {
        return new Promise((resolve, reject) => {
            if(this.user_id === undefined) {
                reject("User ID not set");
            }

            if(this.layout === undefined) {
                reject("Layout not set");
            }

            if(this.layout.hasOwnProperty('widgets')) {
                var widgets = [];

                this.layout.widgets.forEach(widget => {
                    var widgetObj = new module.exports.Widget(widget.widget_id, this.user_id);

                    widgets.push(widgetObj);
                });

                resolve(widgets);
            } else {
                reject("Layout does not have widgets array");
            }
        });
    }

    /**
     * Gets all the widgets in the database, even if they are not in the layout
     */
    getAllWidgets() {
        return new Promise((resolve, reject) => {
            if(this.user_id === undefined) {
                reject("User ID not set");
            }

            const connection = db.getConnection();

            connection.connect();

            connection.query("SELECT HEX(widget_id) as WidgetID FROM widgets WHERE user_id = UNHEX(" + connection.escape(this.user_id) + ")",
            (error, results, fields) => {
                connection.end();

                if (error) reject(error);

                var widgets = [];
                results.forEach(result => {
                    var widget = new module.exports.Widget(result.WidgetID);

                    widgets.push(widget);
                });

                resolve(widgets);
            });
        });
    }

    /**
     * Set up the default layout for a user
     */
    prepareUser() {
        if(this.user_id === undefined) {
            return false;
        }

        if(this.layout === undefined || this.layout === null) {
            this.layout = {};
            this.layout.widgets = [];

            return true;
        }

        if(!this.layout.hasOwnProperty('widgets')) {
            this.layout.widgets = [];
            return true;
        }
    }

    /**
     * Adds a widget to the layout
     * 
     * @param {Widget} widget The widget to add
     * @param {int} height The height of the widget
     * @param {int} position The position of the widget
     */
    addWidget(widget, height, position) {
        if(this.user_id === undefined) {
            return false;
        }

        if(this.layout === undefined) {
            return false;
        }

        if(!this.layout.hasOwnProperty('widgets')) {
            this.layout.widgets = [];
        }

        if (widget === undefined) {
            return false;
        }

        if(height === undefined) {
            height = 200;
        }

        // Get the highest position
        if(position === undefined) {
            position = 0;

            this.layout.widgets.forEach(widget => {
                if(widget.position > position) {
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
     * Deletes a widget from the layout
     * 
     * @param {string} widget_id The ID of the widget to delete
     */
    deleteWidget(widget_id) {
        if(this.user_id === undefined) {
            return false;
        }

        if(this.layout === undefined) {
            return false;
        }

        if(!this.layout.hasOwnProperty('widgets')) {
            return false;
        }

        if(widget_id === undefined) {
            return false;
        }

        var position = 0;
        this.layout.widgets.forEach(widget => {
            if(widget.widget_id == widget_id) {
                this.layout.widgets.splice(position, 1);
            }
            position++;
        });

        return true;
    }

    /**
     * Updates details about a widget in the layout
     * 
     * @param {string} widget_id The ID of the widget to update
     * @param {int} position The position
     * @param {int} height The height
     */
    updateWidget(widget_id, position, height) {
        if(this.user_id === undefined) {
            return false;
        }

        if(this.layout === undefined) {
            return false;
        }

        if(!this.layout.hasOwnProperty('widgets')) {
            return false;
        }

        if(widget_id === undefined) {
            return false;
        }

        for(var i = 0; i < this.layout.widgets.length; i++) {
            var widget = this.layout.widgets[i];

            if(widget.widget_id == widget_id) {
                if(position) {
                    widget.position = position;
                }

                if(height) {
                    widget.height = height;
                }
            }
        }

        return true;
    }

    /**
     * Gets a widget from the layout as an object
     * 
     * @param {string} widget_id The ID of the widget
     */
    getWidget(widget_id) {
        if(this.user_id === undefined) {
            return false;
        }

        if(this.layout === undefined) {
            return false;
        }

        if(!this.layout.hasOwnProperty('widgets')) {
            return false;
        }

        if(widget_id === undefined) {
            return false;
        }

        for(var i = 0; i < this.layout.widgets.length; i++) {
            var widget = this.layout.widgets[i];

            if(widget.widget_id == widget_id) {
                return new module.exports.Widget(widget.widget_id, this.user_id);
            }
        }

        return false;
    }
}
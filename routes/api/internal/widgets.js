/*
Copyright (C) 2019-2020 Bester Intranet
*/

const express = require('express');

const Util = require('../../../core/util');
const { Auth, AccessToken, User, Nonce } = require('../../../core/auth');
const app = require('../../../app');
const { WidgetManager, Widget } = require('../../../core/widgets');

module.exports.getAllWidgets = (req, res, next) => {
    const user = res.locals.user;

    const serverError = (message) => {
        res.status(500).json({
            error: {
                code: 500,
                status: 'Internal Server Error',
                message: message
            }
        });
    }

    var widgetManager = new WidgetManager(user.user_id);

    widgetManager.loadWidgets().then(r => {
        if(!r) {
            serverError('Cannot retrieve widgets list');
        }

        widgetManager.getWidgets().then(r => {
            if(!r) {
                serverError('Cannot retrieve widgets list');
            }

            var layout = JSON.stringify(widgetManager.layout);

            try {
                res.status(200).json(JSON.parse(layout, (key, value) => {
                    if(key == 'widget_id') {
                        return value.toLowerCase();
                    }
                
                    return value;
                }));
            } catch {
                serverError("Syntax error in widgets layout list");
            }
        }, e => {
            serverError("Cannot retrieve widgets list");
        })
    }, e => {
        if(widgetManager.prepareUser()) {
            widgetManager.saveLayout().then(result => {
                if(result == true) {
                    var layout = JSON.stringify(widgetManager.layout);
                    
                    res.status(200).json(JSON.parse(layout, (key, value) => {
                        if(key == 'widget_id') {
                            return value.toLowerCase();
                        }
                    
                        return value;
                    }));
                } else {
                    serverError("Cannot retrieve widgets list");
                }
            }, err => {
                serverError("Cannot retrieve widgets list");
            });
        } else {
            serverError("Cannot retrieve widgets list");
        }
    });
}

module.exports.getWidget = (req, res, next) => {
    const user = res.locals.user;

    const serverError = (message) => {
        res.status(500).json({
            error: {
                code: 500,
                status: 'Internal Server Error',
                message: message
            }
        });
    }

    const notFoundError = (message) => {
        res.status(404).json({
            error: {
                code: 404,
                status: 'Not Found',
                message: message
            }
        });
    }

    const widgetId = req.params.widgetId.toUpperCase();

    var widget = new Widget(widgetId, user.user_id);

    widget.loadInfo().then(r => {
        if(!r) {
            notFoundError("Cannot find widget with that ID");
        }

        var widgetManager = new WidgetManager(user.user_id);

        widgetManager.loadWidgets().then(r => {
            if(!r) {
                serverError("Cannot retrieve widget layout information");
            }

            var data = {
                title: widget.title,
                type: widget.type,
                data: widget.data,
                position: null,
                height: null
            };

            for(var i = 0; i < widgetManager.layout.widgets.length; i++) {
                if(widgetManager.layout.widgets[i].widget_id == widgetId) {
                    data.position = widgetManager.layout.widgets[i].position;
                    data.height = widgetManager.layout.widgets[i].height;

                    break;
                }
            }

            res.status(200).send({
                widget: data
            });
        }, err => {
            serverError("Cannot retrieve widget layout information");
        });
    }, err => {
        notFoundError("Cannot find widget with that ID");
    });
}

module.exports.addWidget = (req, res, next) => {
    const user = res.locals.user;

    const badRequest = (message) => {
        res.status(400).json({
            error: {
                code: 400,
                status: 'Bad Request',
                message: message
            }
        });
    }

    const serverError = (message) => {
        res.status(500).json({
            error: {
                code: 500,
                status: 'Internal Server Error',
                message: message
            }
        });
    }

    const title = req.body.title;
    const type = req.body.type;
    var data = req.body.data;
    var position = req.body.position;
    var height = req.body.height;

    if(title === undefined || title == null) {
        badRequest("Title not set");
    }

    if(title.length <= 0) {
        badRequest("Title not set");
    }

    if(type === undefined || type == null) {
        badRequest("Type not set");
    }

    if(type.length <= 0) {
        badRequest("Type not set");
    }

    if(data === undefined || data == null) {
        data = "";
    }

    if(data.length >= 1) {
        try {
            data = JSON.parse(data);
        } catch {
            badRequest("Data is not valid JSON");
        }
    }

    if(position === undefined || position == null) {
        position = undefined;
    }

    if(position !== undefined) {
        if(position.length <= 0) {
            position = undefined;
        } else {
            if(isNaN(position)) {
                badRequest("Position is not a valid integer");
            } else {
                if(!Number.isInteger(Number(position))) {
                    badRequest("Position is not a valid integer");
                }
            }
        }
    }

    if(height === undefined || height == null) {
        height = undefined;
    }

    if(height !== undefined) {
        if(height.length <= 0) {
            height = undefined;
        } else {
            if(isNaN(height)) {
                badRequest("Height is not a valid integer");
            } else {
                if(!Number.isInteger(Number(height))) {
                    badRequest("Height is not a valid integer");
                }
            }
        }
    }

    Widget.generateWidgetId().then(id => {
        var widget = new Widget(id.toUpperCase(), user.user_id, type, title, data);
        
        widget.saveWidget().then(r => {
            if(!r) {
                serverError("Cannot add widget");
            }

            var widgetManager = new WidgetManager(user.user_id);

            widgetManager.loadWidgets().then(r => {
                if(!r) {
                    serverError("Cannot retrieve widget layout information");
                }

                if(widgetManager.layout === undefined || widgetManager.layout == null) {
                    if(!widgetManager.prepareUser()) {
                        serverError("Cannot add widget");
                    }
                }

                if(!widgetManager.layout.hasOwnProperty('widgets')) {
                    if(!widgetManager.prepareUser()) {
                        serverError("Cannot add widget");
                    }
                }

                if(!widgetManager.addWidget(widget, height, position)) {
                    serverError("Cannot add widget");
                }

                widgetManager.saveLayout().then(r => {
                    if(!r) {
                        serverError("Cannot add widget");
                    }

                    res.status(201).json({
                        widget: {
                            id: widget.widget_id.toLowerCase(),
                            title: widget.title,
                            type: widget.type,
                            data: data,
                            position: position,
                            height: height
                        }
                    });
                }, err => {
                    serverError("Cannot add widget");
                });
            }, err => {
                serverError("Cannot retrieve widget layout information");
            });
        }, err => {
            serverError("Cannot add widget");
        });
    }, err => {
        serverError("Cannot generate an ID for the new widget");
    });
}

module.exports.deleteWidget = (req, res, next) => {
    const user = res.locals.user;

    const serverError = (message) => {
        res.status(500).json({
            error: {
                code: 500,
                status: 'Internal Server Error',
                message: message
            }
        });
    }

    const notFoundError = (message) => {
        res.status(404).json({
            error: {
                code: 404,
                status: 'Not Found',
                message: message
            }
        });
    }

    const widgetId = req.params.widgetId.toUpperCase();

    var widget = new Widget(widgetId, user.user_id);

    widget.loadInfo().then(r => {
        if(!r) {
            notFoundError("Cannot find widget with that ID");
        }

        var widgetManager = new WidgetManager(user.user_id);

        widgetManager.loadWidgets().then(r => {
            if(!r) {
                serverError("Cannot retrieve widget layout information");
            }

            widget.deleteWidget().then(r => {
                if(!r) {
                    serverError("Cannot delete widget");
                }

                if(!widgetManager.deleteWidget(widget.widget_id.toUpperCase())) {
                    serverError("Cannot delete widget");
                }

                widgetManager.saveLayout().then(r => {
                    if(!r) {
                        serverError("Cannot delete widget");
                    }

                    res.status(200).send({
                        message: 'Deleted widget successfully'
                    });
                }, err => {
                    serverError("Cannot delete widget");
                });
            }, err => {
                serverError("Cannot delete widget");
            });
        }, err => {
            serverError("Cannot retrieve widget layout information");
        });
    }, err => {
        notFoundError("Cannot find widget with that ID");
    });
}

module.exports.updateWidget = (req, res, next) => {
    const user = res.locals.user;

    const badRequest = (message) => {
        res.status(400).json({
            error: {
                code: 400,
                status: 'Bad Request',
                message: message
            }
        });
    }

    const serverError = (message) => {
        res.status(500).json({
            error: {
                code: 500,
                status: 'Internal Server Error',
                message: message
            }
        });
    }

    const notFoundError = (message) => {
        res.status(404).json({
            error: {
                code: 404,
                status: 'Not Found',
                message: message
            }
        });
    }

    const widgetId = req.params.widgetId.toUpperCase();

    var title = req.body.title;
    var type = req.body.type;
    var data = req.body.data;
    var position = req.body.position;
    var height = req.body.height;

    if(title === undefined || title == null) {
        title = undefined;
    }

    if(title !== undefined) {
        if(title.length <= 0) {
            title = undefined;
        }
    }

    if(type === undefined || type == null) {
        type = undefined;
    }

    if(type !== undefined) {
        if(type.length <= 0) {
            type = undefined;
        }
    }

    if(data === undefined || data == null) {
        data = undefined;
    }

    if(data !== undefined) {
        if(data.length >= 1) {
            try {
                JSON.parse(data);
            } catch {
                badRequest("Data is not valid JSON");
            }
        } else {
            data = undefined;
        }
    }  

    if(position === undefined || position == null) {
        position = undefined;
    }

    if(position !== undefined) {
        if(position.length <= 0) {
            position = undefined;
        } else {
            if(isNaN(position)) {
                badRequest("Position is not a valid integer");
            } else {
                if(!Number.isInteger(Number(position))) {
                    badRequest("Position is not a valid integer");
                }
            }
        }
    }

    if(height === undefined || height == null) {
        height = undefined;
    }

    if(height !== undefined) {
        if(height.length <= 0) {
            height = undefined;
        } else {
            if(isNaN(height)) {
                badRequest("Height is not a valid integer");
            } else {
                if(!Number.isInteger(Number(height))) {
                    badRequest("Height is not a valid integer");
                }
            }
        }
    }

    var widget = new Widget(widgetId, user.user_id);

    widget.loadInfo().then(r => {
        if(!r) {
            notFoundError("Cannot find widget with that ID");
        }

        if(title !== undefined) {
            widget.title = title;
        }

        if(type !== undefined) {
            widget.type = type;
        }

        if(data !== undefined) {
            widget.data = JSON.parse(data);
        }

        widget.saveWidget().then(r => {
            if(!r) {
                serverError("Cannot save widget information");
            }
    
            var widgetManager = new WidgetManager(user.user_id);
    
            widgetManager.loadWidgets().then(r => {
                if(!r) {
                    serverError("Cannot retrieve widget layout information");
                }
    
                if(widgetManager.layout === undefined || widgetManager.layout == null) {
                    if(!widgetManager.prepareUser()) {
                        serverError("Cannot save widget information");
                    }
                }
    
                if(!widgetManager.layout.hasOwnProperty('widgets')) {
                    if(!widgetManager.prepareUser()) {
                        serverError("Cannot save widget information");
                    }
                }

                if(position !== undefined) {
                    position = parseInt(position);
                }

                if(height !== undefined) {
                    height = parseInt(height);
                }
    
                if(!widgetManager.updateWidget(widget.widget_id.toUpperCase(), position, height)) {
                    serverError("Cannot save widget information");
                }
    
                widgetManager.saveLayout().then(r => {
                    if(!r) {
                        serverError("Cannot save widget information");
                    }
    
                    res.status(200).json({
                        widget: {
                            id: widget.widget_id.toLowerCase(),
                            title: widget.title,
                            type: widget.type,
                            data: data,
                            position: position,
                            height: height
                        }
                    });
                }, err => {
                    serverError("Cannot save widget information");
                });
            }, err => {
                serverError("Cannot retrieve widget layout information");
            });
        }, err => {
            serverError("Cannot save widget information");
        });
    }, err => {
        notFoundError("Cannot find widget with that ID");
    });
}

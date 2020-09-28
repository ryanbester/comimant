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

const { Sanitizer } = require('../../../core/sanitizer');
const { WidgetManager } = require('../../../core/widgets/widgetmanager');
const { Widget } = require('../../../core/widgets/widget');
const { returnError } = require('../../../core/api-status');

exports.getAllWidgets = (req, res) => {
    const user = res.locals.user;

    const widgetManager = new WidgetManager(user.user_id);
    widgetManager.loadWidgets().then(r => {
        widgetManager.getWidgets().then(r => {
            const layout = JSON.stringify(widgetManager.layout);

            try {
                res.status(200).json(JSON.parse(layout, (key, value) => {
                    if (key === 'widget_id') {
                        return value.toLowerCase();
                    }

                    return value;
                }));
            } catch {
                returnError(res, 500, 'Cannot retrieve widgets list');
            }
        }, _ => {
            returnError(res, 500, 'Cannot retrieve widgets list');
        });
    }, _ => {
        returnError(res, 500, 'Cannot retrieve widgets list');
    });
};

exports.addWidget = (req, res) => {
    res.send('Add widget').end();
};

exports.getWidget = (req, res) => {
    const user = res.locals.user;

    let { widgetId } = req.params;
    widgetId = Sanitizer.ascii(Sanitizer.whitespace(Sanitizer.string(widgetId.toUpperCase())));

    if (!widgetId) {
        returnError(res, 400, 'Widget ID is not valid');
        return;
    }

    const widget = new Widget(widgetId, user.user_id);
    widget.loadInfo().then(r => {
        const widgetManager = new WidgetManager(user.user_id);
        widgetManager.loadWidgets().then(r => {
            const data = {
                title: widget.title,
                type: widget.type,
                data: widget.data,
                position: null,
                height: null
            };

            for (let i = 0; i < widgetManager.layout.widgets.length; i++) {
                if (widgetManager.layout.widgets[i].widget_id === widgetId) {
                    data.position = widgetManager.layout.widgets[i].position;
                    data.height = widgetManager.layout.widgets[i].height;

                    break;
                }
            }

            res.status(200).send({
                widget: data
            });
        }, _ => {
            returnError(res, 500, 'Cannot retrieve widget layout information');
        });
    }, _ => {
        returnError(res, 404, 'Cannot find widget with that ID');
    });
};

exports.deleteWidget = (req, res) => {
    res.send('Delete widget').end();
};

exports.updateWidget = (req, res) => {
    res.send('Update widget').end();
};

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

const editWidgetDialog = function () {
    return {
        created: function (widget) {
            this.getProperties(widget);
            let dialogTitle = $('#widget-edit-dialog-title');

            this.setPreviewTitle(dialogTitle.val());

            dialogTitle.keyup($.debounce(250, function () {
                this.setPreviewTitle(dialogTitle.val());
            }));
        },
        getProperties: function (widgetObj) {
            const container = document.getElementById('widget-edit-dialog-properties-container');

            fetch('/api/internal/widgets/types').then(async function (res) {
                if (res.ok) {
                    await res.json().then(function (json) {
                        let typeFound = false;
                        for (let i = 0; i < json.widget_types.length; i++) {
                            const widgetType = json.widget_types[i];
                            if (widgetType.name === widgetObj.type) {
                                typeFound = true;

                                if (!widgetType.hasOwnProperty('methods')) {
                                    container.innerHTML = '<p id="widget-edit-dialog-properties-message">Unknown widget type</p>';
                                    return;
                                }

                                if (!widgetType.methods.hasOwnProperty('get_properties')) {
                                    container.innerHTML = '<p id="widget-edit-dialog-properties-message">Unknown widget type</p>';
                                    return;
                                }

                                if (!widget.widgetMethods.hasOwnProperty(widgetType.methods.get_properties)) {
                                    container.innerHTML = '<p id="widget-edit-dialog-properties-message">Unknown widget type</p>';
                                    return;
                                }

                                widget.widgetMethods[widgetType.methods.get_properties](container, 'edit', widgetObj);
                                break;
                            }
                        }
                    });
                }
            });
        },
        setPreviewTitle: function (title) {
            if (title !== undefined) {
                $('#widget-edit-dialog-preview .home-page-grid-container__widget-title h1').get(0).innerHTML = title;
            }
        }
    };
}();

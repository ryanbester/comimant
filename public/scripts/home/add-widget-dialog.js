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

const addWidgetDialog = function () {
    return {
        created: function (modal, widgetTypesPromise) {
            this.widgetTypesPromise = widgetTypesPromise;

            $('#widget-add-dialog-title').keyup($.debounce(250, function () {
                this.setPreviewTitle($('#widget-add-dialog-title').val());
            }));

            widgetTypesPromise.then(async function (res) {
                if (res.ok) {
                    await res.clone().json().then(function (json) {
                        addWidgetDialog.widgetTypes = {};
                        document.getElementById('widget-add-dialog-type-container__loading').style.display = 'none';

                        let typeContainer = document.getElementById('widget-add-dialog-types');
                        json.widget_types.forEach(function (widgetType) {
                            addWidgetDialog.widgetTypes[widgetType.name] = widgetType;

                            let typeButton = document.createElement('div');
                            typeButton.setAttribute('class', 'widget-add-dialog-type-container__item');
                            typeButton.setAttribute('data-type', widgetType.name);

                            let typeButtonImage = document.createElement('img');
                            typeButtonImage.setAttribute('class', 'widget-add-dialog-type-container__item-image');
                            typeButtonImage.setAttribute('src', widgetType.icon_url);

                            let typeButtonText = document.createElement('p');
                            typeButtonText.setAttribute('class', 'widget-add-dialog-type-container__item-text');
                            typeButtonText.innerText = widgetType.title;

                            typeButton.append(typeButtonImage, typeButtonText);
                            typeContainer.appendChild(typeButton);

                            typeButton.addEventListener('click', function () {
                                $('.widget-add-dialog-type-container__item').removeClass('active');
                                $(typeButton).addClass('active');
                                $('#widget-add-dialog-properties-message').remove();

                                const type = typeButton.getAttribute('data-type');
                                $('#widget-add-dialog-type').val(type);
                                addWidgetDialog.typeChange(type);
                            });
                        });
                    });
                }
            });
        },
        typeChange: function (newType) {
            const container = document.getElementById('widget-add-dialog-properties-container');

            if (!this.widgetTypes.hasOwnProperty(newType)) {
                container.innerHTML = '<p id="widget-add-dialog-properties-message">Unknown widget type</p>';
                return;
            }

            let widgetType = this.widgetTypes[newType];
            if (!widgetType.hasOwnProperty('methods')) {
                container.innerHTML = '';
                return;
            }

            if (!widgetType.methods.hasOwnProperty('get_properties')) {
                container.innerHTML = '';
                return;
            }

            if (!widget.widgetMethods.hasOwnProperty(widgetType.methods.get_properties)) {
                container.innerHTML = '';
                return;
            }

            widget.widgetMethods[widgetType.methods.get_properties](container, 'add');
        },
        setPreviewTitle: function (title) {
            if (title !== undefined) {
                $('#widget-add-dialog-preview .home-page-grid-container__widget-title h1').get(0).innerHTML = title;
            }
        }
    };
}();

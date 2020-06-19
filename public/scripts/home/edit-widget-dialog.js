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

            dialogTitle.keyup($.debounce(250, _ => {
                this.setPreviewTitle(dialogTitle.val());
            }));
        },
        getProperties: function (widget) {
            const container = document.getElementById('widget-edit-dialog-properties-container');

            switch (widget.type) {
                case 'weather':
                    this.weatherProperties(container, widget);
                    break;
                case 'news':
                    this.newsProperties(container, widget);
                    break;
                default:
                    container.innerHTML = '<p id="widget-edit-dialog-properties-message">Unknown widget type</p>';
            }
        },
        weatherProperties: function (container, widget) {
            const updateWidgetContent = _ => {
                getWidgetContent('weather', {
                    location: $('#widget-edit-dialog-weather-location').val(),
                    units: $('input[name=widget-edit-dialog-weather-temperature]:checked').val(),
                    source: $('#widget-edit-dialog-weather-source').val()
                }, $('#widget-edit-dialog-preview .home-page-grid-container__widget-content').get(0));
            };

            container.innerHTML = `
                <label for="widget-edit-dialog-weather-source">Source</label>
                <select id="widget-edit-dialog-weather-source">
                    <option ` + (widget.data.source === 'openweathermap' ? 'selected' : '') + ` value="openweathermap">OpenWeatherMap</option>
                </select>
                <br />
                <label for="widget-edit-dialog-weather-location">Location</label>
                <input id="widget-edit-dialog-weather-location" type="text" placeholder="Location" class="inline" value="` + widget.data.location + `" />
                <br />
                <label class="radio-container inline">&deg;C
                    <input ` + (widget.data.units === 'c' ? 'checked' : '') + ` type="radio" id="widget-edit-dialog-weather-temperature-celsius" name="widget-edit-dialog-weather-temperature" value="c" checked>
                    <span class="radio-checkmark"></span>
                </label>
                <label class="radio-container inline">&deg;F
                    <input ` + (widget.data.units === 'f' ? 'checked' : '') + ` type="radio" id="widget-edit-dialog-weather-temperature-fahrenheit" name="widget-edit-dialog-weather-temperature" value="f">
                    <span class="radio-checkmark"></span>
                </label>
            `;

            updateWidgetContent();

            $('#widget-edit-dialog-weather-source').change(e => {
                updateWidgetContent();
            });

            $('#widget-edit-dialog-weather-location').keyup($.debounce(250, _ => {
                updateWidgetContent();
            }));

            $('input[name=widget-edit-dialog-weather-temperature]').change(e => {
                updateWidgetContent();
            });
        },
        newsProperties: function (container, widget) {
            const updateWidgetContent = _ => {
                getWidgetContent('news', {
                    source: $('#widget-edit-dialog-news-source').val()
                }, $('#widget-edit-dialog-preview .home-page-grid-container__widget-content').get(0));
            };

            container.innerHTML = `
                <label for="widget-edit-dialog-news-source">Source</label>
                <select id="widget-edit-dialog-news-source">
                    <option ` + (widget.data.source === 'google-news' ? 'selected' : '') + ` value="google-news">Google News</option>
                </select>
            `;

            updateWidgetContent();

            $('#widget-edit-dialog-news-source').change(e => {
                updateWidgetContent();
            });
        },
        setPreviewTitle: function (title) {
            if (title !== undefined) {
                $('#widget-edit-dialog-preview .home-page-grid-container__widget-title h1').get(0).innerHTML = title;
            }
        }
    };
}();
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


widget.widgetMethods.weatherWidget = (data, container) => {
    if (!data.hasOwnProperty('location')) {
        container.innerHTML = '<p>Cannot get weather information</p>';
    }

    if (!data.hasOwnProperty('source')) {
        container.innerHTML = '<p>Cannot get weather information</p>';
    }

    let units = data.units;

    if (!data.hasOwnProperty('units')) {
        units = 'c';
    }

    /*fetch('/api/internal/weather/?source=' + data.source + '&location=' + data.location + '&units=' + units)
        .then(async function (res) {
            if (res.ok) {
                await res.json().then(function (json) {
                    container.innerHTML = '<p>Weather in ' + json.location + '</p>'
                        + '<p>Temperature: ' + json.temperature + '&deg;' + json.units + '</p>'
                        + '<p>Feels like: ' + json.feels_like + '&deg;' + json.units + '</p>';
                });
            } else {
                container.innerHTML = '<p>Cannot get weather information</p>';
            }
        }).catch(function () {
        container.innerHTML = '<p>Cannot get weather information</p>';
    });*/
    container.innerHTML = '<p>Not implemented</p>';
};

widget.widgetMethods.weatherProperties = function (container, action, widgetObj) {
    const updateWidgetContent = function () {
        widget.getContent('weather', {
            location: $('#widget-' + action + '-dialog-weather-location').val(),
            units: $('input[name=widget-' + action + '-dialog-weather-temperature]:checked').val(),
            source: $('#widget-' + action + '-dialog-weather-source').val()
        }, $('#widget-' + action + '-dialog-preview .home-page-grid-container__widget-content').get(0));
    };

    if (widgetObj === undefined) {
        container.innerHTML = `
                <label for="widget-${action}-dialog-weather-source">Source</label>
                <select id="widget-${action}-dialog-weather-source">
                    <option value="openweathermap">OpenWeatherMap</option>
                </select>
                <br />
                <label for="widget-${action}-dialog-weather-location">Location</label>
                <input id="widget-${action}-dialog-weather-location" type="text" placeholder="Location" class="inline" />
                <br />
                <label class="radio-container inline">&deg;C
                    <input type="radio" id="widget-${action}-dialog-weather-temperature-celsius" name="widget-${action}-dialog-weather-temperature" value="c" checked>
                    <span class="radio-checkmark"></span>
                </label>
                <label class="radio-container inline">&deg;F
                    <input type="radio" id="widget-${action}-dialog-weather-temperature-fahrenheit" name="widget-${action}-dialog-weather-temperature" value="f">
                    <span class="radio-checkmark"></span>
                </label>
            `;
    } else {
        container.innerHTML = `
                <label for="widget-${action}-dialog-weather-source">Source</label>
                <select id="widget-${action}-dialog-weather-source">
                    <option ` + (widgetObj.data.source === 'openweathermap' ? 'selected' : '') + ` value="openweathermap">OpenWeatherMap</option>
                </select>
                <br />
                <label for="widget-${action}-dialog-weather-location">Location</label>
                <input id="widget-${action}-dialog-weather-location" type="text" placeholder="Location" class="inline" value="` + widgetObj.data.location + `" />
                <br />
                <label class="radio-container inline">&deg;C
                    <input ` + (widgetObj.data.units === 'c' ? 'checked' : '') + ` type="radio" id="widget-${action}-dialog-weather-temperature-celsius" name="widget-${action}-dialog-weather-temperature" value="c" checked>
                    <span class="radio-checkmark"></span>
                </label>
                <label class="radio-container inline">&deg;F
                    <input ` + (widgetObj.data.units === 'f' ? 'checked' : '') + ` type="radio" id="widget-${action}-dialog-weather-temperature-fahrenheit" name="widget-${action}-dialog-weather-temperature" value="f">
                    <span class="radio-checkmark"></span>
                </label>
            `;
    }

    updateWidgetContent();

    $('#widget-' + action + '-dialog-weather-source').change(function () {
        updateWidgetContent();
    });

    $('#widget-' + action + '-dialog-weather-location').keyup($.debounce(250, function () {
        updateWidgetContent();
    }));

    $('input[name=widget-' + action + '-dialog-weather-temperature]').change(function () {
        updateWidgetContent();
    });
};

widget.widgetMethods.parseWeatherProperties = (properties, html) => {
    const data = {};

    for (let i = 0; i < properties.length; i++) {
        if (properties[i].id === 'widget-add-dialog-weather-source'
            || properties[i].id === 'widget-edit-dialog-weather-source') {
            data.source = properties[i].value;
        }

        if (properties[i].id === 'widget-add-dialog-weather-location'
            || properties[i].id === 'widget-edit-dialog-weather-location') {
            data.location = properties[i].value;
        }

        if (properties[i].id === 'widget-add-dialog-weather-temperature'
            || properties[i].id === 'widget-edit-dialog-weather-temperature') {
            data.units = properties[i].value;
        }
    }

    return data;
};

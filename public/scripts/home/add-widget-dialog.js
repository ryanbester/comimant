/*
 * Copyright (C) 2019 - 2020 Comimant
 */

const addWidgetDialog = function () {
    return {
        created: function (modal) {
            const types = document.getElementsByClassName('widget-add-dialog-type-container__item');
            Array.prototype.forEach.call(types, element => {
                element.addEventListener('click', e => {
                    $('.widget-add-dialog-type-container__item').removeClass('active');
                    $(element).addClass('active');
                    $('#widget-add-dialog-properties-message').remove();

                    var type = element.getAttribute('data-type');
                    $('#widget-add-dialog-type').val(type);
                    this.typeChange(type);
                });
            });

            $('#widget-add-dialog-title').keyup($.debounce(250, _ => {
                this.setPreviewTitle($('#widget-add-dialog-title').val());
            }));
        },
        typeChange: function (newType) {
            const container = document.getElementById('widget-add-dialog-properties-container');

            switch (newType) {
                case 'weather':
                    this.weatherProperties(container);
                    break;
                case 'news':
                    this.newsProperties(container);
                    break;
                case 'sports':
                    container.innerHTML = '<p>Coming soon</p>';
                    break;
                case 'heating':
                    container.innerHTML = '<p>Coming soon</p>';
                    break;
                case 'web-feed':
                    container.innerHTML = '<p>Coming soon</p>';
                    break;
                case 'ebay':
                    container.innerHTML = '<p>Coming soon</p>';
                    break;
                case 'bookmarks':
                    container.innerHTML = '<p>Coming soon</p>';
                    break;
                case 'todo':
                    container.innerHTML = '<p>Coming soon</p>';
                    break;
                case 'files':
                    container.innerHTML = '<p>Coming soon</p>';
                    break;
                case 'email':
                    container.innerHTML = '<p>Coming soon</p>';
                    break;
                case 'rss':
                    container.innerHTML = '<p>Coming soon</p>';
                    break;
                default:
                    container.innerHTML = '<p id="widget-add-dialog-properties-message">Unknown widget type</p>';
            }
        },
        weatherProperties: function (container) {
            const updateWidgetContent = _ => {
                getWidgetContent('weather', {
                    location: $('#widget-add-dialog-weather-location').val(),
                    units: $('input[name=widget-add-dialog-weather-temperature]:checked').val(),
                    source: $('#widget-add-dialog-weather-source').val()
                }, $('#widget-add-dialog-preview .home-page-grid-container__widget-content').get(0));
            };

            container.innerHTML = `
                <label for="widget-add-dialog-weather-source">Source</label>
                <select id="widget-add-dialog-weather-source">
                    <option value="openweathermap">OpenWeatherMap</option>
                </select>
                <br />
                <label for="widget-add-dialog-weather-location">Location</label>
                <input id="widget-add-dialog-weather-location" type="text" placeholder="Location" class="inline" />
                <br />
                <label class="radio-container inline">&deg;C
                    <input type="radio" id="widget-add-dialog-weather-temperature-celsius" name="widget-add-dialog-weather-temperature" value="c" checked>
                    <span class="radio-checkmark"></span>
                </label>
                <label class="radio-container inline">&deg;F
                    <input type="radio" id="widget-add-dialog-weather-temperature-fahrenheit" name="widget-add-dialog-weather-temperature" value="f">
                    <span class="radio-checkmark"></span>
                </label>
            `;

            $('#widget-add-dialog-weather-source').change(e => {
                updateWidgetContent();
            });

            $('#widget-add-dialog-weather-location').keyup($.debounce(250, _ => {
                updateWidgetContent();
            }));

            $('input[name=widget-add-dialog-weather-temperature]').change(e => {
                updateWidgetContent();
            });
        },
        newsProperties: function (container) {
            const updateWidgetContent = _ => {
                getWidgetContent('news', {
                    source: $('#widget-add-dialog-news-source').val()
                }, $('#widget-add-dialog-preview .home-page-grid-container__widget-content').get(0));
            };

            container.innerHTML = `
                <label for="widget-add-dialog-news-source">Source</label>
                <select id="widget-add-dialog-news-source">
                    <option value="google-news">Google News</option>
                </select>
            `;

            updateWidgetContent();

            $('#widget-add-dialog-news-source').change(e => {
                updateWidgetContent();
            });
        },
        setPreviewTitle: function (title) {
            if (title !== undefined) {
                $('#widget-add-dialog-preview .home-page-grid-container__widget-title h1').get(0).innerHTML = title;
            }
        }
    };
}();
/*
 * Copyright (C) 2019 - 2020 Comimant
 */

const getWidgetContent = (type, data, container) => {
    switch (type) {
        case 'weather':
            weatherWidget(data, container);
            break;
        case 'news':
            newsWidget(data, container);
            break;
        default:
            return '<p>Unknown widget type</p>';
    }
};

const weatherWidget = (data, container) => {
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

    fetch('/api/internal/weather/?source=' + data.source + '&location=' + data.location + '&units=' + units)
        .then(async res => {
            if (res.ok) {
                await res.json().then(json => {
                    container.innerHTML = '<p>Weather in ' + json.location + '</p>'
                        + '<p>Temperature: ' + json.temperature + '&deg;' + json.units + '</p>'
                        + '<p>Feels like: ' + json.feels_like + '&deg;' + json.units + '</p>';
                });
            } else {
                container.innerHTML = '<p>Cannot get weather information</p>';
            }
        }).catch(e => {
        container.innerHTML = '<p>Cannot get weather information</p>';
    });
};

const newsWidget = (data, container) => {
    if (!data.hasOwnProperty('source')) {
        container.innerHTML = '<p>Cannot get news</p>';
    }

    let url;

    switch (data.source) {
        case 'google-news':
            url = 'https://news.google.com/rss';
            break;
        default:
            container.innerHTML = '<p>Unknown news source</p>';
    }

    if (url !== undefined) {
        fetch('/api/internal/rss/?url=' + url + '&items=3').then(async res => {
            if (res.ok) {
                await res.json().then(json => {
                    let html = `
                    <div class="home-page-widget-news-container">
                    `;

                    for (var i = 0; i < json.items.length; i++) {
                        html += `
                        <div class="home-page-widget-news-container-item">
                            <h2><a target="_blank" href="` + json.items[i].link + `">` + json.items[i].title + `</a></h2>
                        </div>
                        `;
                    }

                    html += '</div>';

                    container.innerHTML = html;
                });
            } else {
                container.innerHTML = '<p>Cannot get news</p>';
            }
        }).catch(e => {
            container.innerHTML = '<p>Cannot get news</p>';
        });
    }
};

const parseProperties = (type, properties, html) => {
    switch (type) {
        case 'weather':
            return parseWeatherProperties(properties, html);
        case 'news':
            return parseNewsProperties(properties, html);
        default:
            return {};
    }
};

const parseWeatherProperties = (properties, html) => {
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

const parseNewsProperties = (properties, html) => {
    const data = {};

    for (let i = 0; i < properties.length; i++) {
        if (properties[i].id === 'widget-add-dialog-news-source'
            || properties[i].id === 'widget-edit-dialog-news-source') {
            data.source = properties[i].value;
        }
    }

    return data;
};
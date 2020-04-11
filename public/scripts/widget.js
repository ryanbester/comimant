/*
Copyright (C) 2019-2020 Bester Intranet
*/

const getWidgetContent = (type, data, container) => {
    switch(type) {
        case 'weather':
            weatherWidget(data, container);
            break;
        default:
            return "<p>Unknown widget type</p>";
    }
}

const weatherWidget = (data, container) => {    
    if(!data.hasOwnProperty("location")) {
        container.innerHTML =  "<p>Cannot get weather information</p>";
    }

    if(!data.hasOwnProperty("source")) {
        container.innerHTML =  "<p>Cannot get weather information</p>";
    }

    var units = data.units;

    if(!data.hasOwnProperty("units")) {
        units = 'c';
    }

    fetch('/api/internal/weather/?source=' + data.source + "&location=" + data.location + "&units=" + units).then(async res => {
        if(res.ok) {
            await res.json().then(json => {
                container.innerHTML = '<p>Weather in ' + json.location + '</p>'
                + '<p>Temperature: ' + json.temperature + '&deg;' + json.units + '</p>'
                + '<p>Feels like: ' + json.feels_like + '&deg;' + json.units + '</p>';
            });
        } else {
            container.innerHTML =  "<p>Cannot get weather information</p>";
        }
    }).catch(e => {
        container.innerHTML =  "<p>Cannot get weather information</p>";
    });
}

const parseProperties = (type, properties, html) => {
    switch(type) {
        case 'weather':
            return parseWeatherProperties(properties, html);
        default:
            return {};
    }
}

const parseWeatherProperties = (properties, html) => {
    var data = {};

    for(var i = 0; i < properties.length; i++) {
        if(properties[i].id == 'widget-add-dialog-weather-source'
            || properties[i].id == 'widget-edit-dialog-weather-source') {
            data.source = properties[i].value;
        }

        if(properties[i].id == 'widget-add-dialog-weather-location'
            || properties[i].id == 'widget-edit-dialog-weather-location') {
            data.location = properties[i].value;
        }

        if(properties[i].id == 'widget-add-dialog-weather-temperature'
            || properties[i].id == 'widget-edit-dialog-weather-temperature') {
            data.units = properties[i].value;
        }
    }

    return data;
}
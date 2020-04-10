/*
Copyright (C) 2019-2020 Bester Intranet
*/

const express = require('express');
const https = require('https');

const Util = require('../../../core/util');
const { Auth, AccessToken, User, Nonce } = require('../../../core/auth');
const app = require('../../../app');
const { WidgetManager, Widget } = require('../../../core/widgets');

module.exports.getWeather = (req, res, next) => {
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

    const source = req.query.source;
    const location = req.query.location;
    const units = req.query.units;

    if(source === undefined || source == null) {
        badRequest("Source not set");
    }

    if(source.length <= 0) {
        badRequest("Source not set");
    }

    if(location === undefined || location == null) {
        badRequest("Location not set");
    }

    if(location.length <= 0) {
        badRequest("Location not set");
    }

    if(units === undefined || units == null) {
        badRequest("Units not set");
    }

    if(!(units.toLowerCase() == 'c' || units.toLowerCase() == 'f')) {
        badRequest("Unknown units");
    }

    switch(source.toLowerCase()) {
        case 'openweathermap':
            var unitsConverted = 'imperial';

            if(units.toLowerCase() == 'c') {
                unitsConverted = 'metric';
            }
            
            https.get('https://api.openweathermap.org/data/2.5/weather?q=' + location + '&units=' + unitsConverted + '&appid=' + process.env.OPENWEATHERMAP_API_KEY, resp => {
                let data = '';

                resp.on('data', chunk => {
                    data += chunk;
                });

                resp.on('end', _ => {
                    if(resp.statusCode == 200) {
                        var json = JSON.parse(data);

                        res.status(200).json({
                            location: json.name + ", " + json.sys.country,
                            weather: json.weather[0].main,
                            temperature: parseFloat(json.main.temp.toFixed(1)),
                            feels_like: parseFloat(json.main.feels_like.toFixed(1)),
                            units: units.toUpperCase()
                        });
                    } else {
                        if(resp.statusCode == 404) {
                            res.status(404).json({
                                error: {
                                    code: 404,
                                    status: 'Not Found',
                                    message: "Location not found"
                                }
                            });
                        }

                        serverError("Failed to get weather data");
                    }
                });
            }).on("error", e => {
                serverError(e.message);
            });
            break;
        default:
            badRequest("Invalid source");
    }
}
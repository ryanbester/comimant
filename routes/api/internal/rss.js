/*
Copyright (C) 2019-2020 Bester Intranet
*/

const express = require('express');
const https = require('https');
const rssParser = require('rss-parser');

const Util = require('../../../core/util');
const { Auth, AccessToken, User, Nonce } = require('../../../core/auth');
const app = require('../../../app');
const { WidgetManager, Widget } = require('../../../core/widgets');

module.exports.getRSSFeed = (req, res, next) => {
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

    const url = req.query.url;
    const items = req.query.items;

    if(url === undefined || url == null) {
        badRequest("URL not set");
    }

    if(url.length <= 0) {
        badRequest("URL not set");
    }

    var noLimit = false;
    if(items === undefined || items == null) {
        noLimit = true;

        if(items < 1) {
            noLimit = true;
        }
    }

    var parser = new rssParser({
        timeout: 1000
    });

    parser.parseURL(url).then(result => {
        if(noLimit) {
            res.status(200).json(result);
        } else {
            var json = { items: [] };
            var itemCount = 0;

            result.items.forEach(item => {
                if(itemCount < items) {
                    json.items.push(item);
                }

                itemCount++;
            });

            res.status(200).json(json);
        }
    }, e => {
        switch(e.message) {
            case 'Status code 404':
                notFoundError('Cannot find resource at URL');
                break;
            default:
                serverError(e.message);
                res.end();
        }
    });
}
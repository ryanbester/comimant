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

const redis = require('redis');
const { PluginManager } = require('../core/plugins/pluginmanager');
//const { PluginManager } = require('../core/plugins');

let client;
let subscriber;

module.exports.getConnection = () => {
    if (client !== undefined) {
        return client;
    }

    client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST);

    client.on('connect', _ => {
        console.log('Connected to Redis server');
    });

    client.on('error', _ => {
        console.error('Error connecting to Redis server');
    });

    return client;
};

module.exports.getSubscriber = () => {
    if (subscriber !== undefined) {
        return subscriber;
    }

    subscriber = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST);

    subscriber.on('connect', _ => {
        console.log('Subscriber: Connected to Redis server');
    });

    subscriber.on('error', _ => {
        console.error('Subscriber: Error connecting to Redis server');
    });

    return subscriber;
};

module.exports.handleMessages = (subscriber) => {
    subscriber.on('message', (channel, message) => {
        switch (channel) {
            case 'plugin-manager':
                PluginManager.handleMessage(message);
                break;
        }
    });
};
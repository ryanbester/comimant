/*
Copyright (C) 2019-2020 Bester Intranet
*/

const redis = require('redis');
const { PluginManager } = require('../core/plugins');

var client;
var subscriber;

module.exports.getConnection = () => {
    if(client !== undefined) {
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
}

module.exports.getSubscriber = () => {
    if(subscriber !== undefined) {
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
}

module.exports.handleMessages = (subscriber) => {
    subscriber.on('message', (channel, message) => {
        switch(channel) {
            case 'plugin-manager':
                PluginManager.handleMessage(message);
                break;
        }
    });
}
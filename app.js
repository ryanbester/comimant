/*
 * Copyright (C) 2019 - 2020 Comimant
 */

/*jshint esversion: 8 */

const path = require('path');
const http = require('http');
const express = require('express');
const connect = require('connect');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const routes = require('./routes/index');
const redis = require('./db/redis');
const { Config } = require('./core/config');
const { PluginManager } = require('./core/plugins/pluginmanager');
const { Util } = require('./core/util');
const { Logger, LoggerColors } = require('./core/logger');

const app = module.exports = express();

global.__approot = path.resolve(__dirname);

app.set('title', 'Comimant');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('etag', false);

app.use(helmet());
app.use(connect());
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({
    extended: true
}));

app.use(function (req, res, next) {
    res.locals.app = app;
    next();
});

app.use('/', routes);

// Handle 404 page
app.use(function (req, res, next) {
    const err = new Error('404: Page not found');
    err.status = 404;
    next(err);
});

// Error handler
app.use(function (err, req, res, next) {
    res.locals.app = app;
    res.locals.env = process.env;
    res.locals.error = err;
    res.locals.error.status = err.status || 500;

    if (req.app.get('env') !== 'development') {
        delete err.stack;
    }

    res.locals.title = err.message;
    res.status(err.status || 500);

    if (req.path.startsWith('/api')) {
        res.json(res.locals.error);
    } else {
        res.render('error', {
            title: 'Error'
        });
    }
});

const startServer = _ => {
    const httpServer = http.createServer(app);
    httpServer.listen(process.env.PORT);

    httpServer.on('listening', _ => {
        Logger.log(LoggerColors.FG_GREEN + 'HTTP Server listening for connections...');
    });
};

Logger.log(LoggerColors.BG_GREEN + 'Welcome to Comimant');

Logger.log(LoggerColors.DIM + 'Loading configuration...');

// Load configuration
const config = Config.getInstance();

if (!config.getOption('security.ssl_enabled', true)) {
    Logger.securityWarning(
        'SSL is not enabled. Consider setting security.ssl_enabled in your configuration file to true.');
}

app.set('title', Util.coalesceString(config.getOption('title'), 'Comimant'));

Logger.log(LoggerColors.DIM + 'Activating plugins...');

// Activate plugins
const subscriber = redis.getSubscriber();

subscriber.subscribe('plugin-manager');
redis.handleMessages(subscriber);

PluginManager.getEnabledPlugins().then(_ => {
    PluginManager.activateEnabledPlugins();

    startServer();
}, e => {
    Logger.error(e);
});

module.exports = app;
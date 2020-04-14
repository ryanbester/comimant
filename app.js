/*
Copyright (C) 2019-2020 Bester Intranet
*/

/*jshint esversion: 8 */

const path = require('path');
const http = require('http');
const fs = require('fs');
const express = require('express');
const connect = require('connect');
const helmet = require('helmet');
const argon2 = require('argon2');
const cookieParser = require('cookie-parser');

const routes = require('./routes/index');
const { User, AccessToken} = require('./core/auth');
const Util = require('./core/util');
const redis = require('./db/redis');

const { Plugin, PluginManager } = require('./core/plugins');

const app = module.exports = express();

app.set('title', "Bester Intranet");

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

app.use(express.json());

app.use(function(req, res, next){
	res.locals.tld = Util.get_tld();
	res.locals.useBootstrap = true;
	res.locals.app = app;
	next();
});

app.use('/', routes);

// Handle 404 page
app.use(function(req, res, next){
	const err = new Error("404: Page not found");
	err.status = 404;
	next(err);
});

// Error handler
app.use(function(err, req, res, next){
	res.locals.app = app;
	res.locals.env = process.env;
	res.locals.error = err;
	res.locals.error.status = err.status || 500;
	
	if(req.app.get('env') !== 'development'){
		delete err.stack;
	}

	res.locals.title = err.message;
	res.status(err.status || 500);
	res.render('error', {useBootstrap: false, title: "Error"});
});

const startServer = _ => {
	var httpServer = http.createServer(app);
	httpServer.listen(process.env.PORT);
	
	httpServer.on('listening', _ => {
		console.log(Util.log_colors.FG_GREEN + 'HTTP Server listening for connections...' + Util.log_colors.RESET);
	});
}

console.log(Util.log_colors.BG_GREEN + 'Welcome to Comimant' + Util.log_colors.RESET);

console.log(Util.log_colors.DIM + 'Activating plugins...' + Util.log_colors.RESET);

// Activate plugins
var subscriber = redis.getSubscriber();

subscriber.subscribe('plugin-manager');
redis.handleMessages(subscriber);

PluginManager.getEnabledPlugins().then(_ => {
	PluginManager.activateEnabledPlugins();

	startServer();
}, e => {
	console.log(e);
});

module.exports = app;

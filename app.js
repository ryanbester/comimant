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

var httpServer = http.createServer(app);
httpServer.listen(process.env.PORT);

module.exports = app;

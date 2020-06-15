/*
Copyright (C) 2019-2020 Bester Intranet
*/

const express = require('express');
const https = require('https');
const path = require('path');

const Util = require('../../../core/util');
const { Auth, AccessToken, User, Nonce } = require('../../../core/auth');
const app = require('../../../app');
const { WidgetManager, Widget } = require('../../../core/widgets');
const { FilesManager, FileIterator } = require('../../../core/files');
const { Service } = require('../../../core/myaccount/servicemanager');

module.exports.getFileLocations = (req, res, next) => {
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

    const fileLocations = FilesManager.getFileLocations();
    
    res.status(200).json(fileLocations.map(fileLocation => {
        delete fileLocation.directory;
        return fileLocation;
    }));
}

module.exports.getFiles = (req, res, next) => {
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

    const sendFiles = (location, directory, files) => {
        delete location.directory;
        
        res.status(200).json({
            location: location,
            directory: directory,
            files: files
        });
    }

    var dir = req.query.path;
    if (dir !== undefined) {
        dir = decodeURIComponent(dir);
    }

    var pattern = req.query.pattern;
    if (pattern === undefined) {
        pattern = "*";
    }

    FilesManager.getFileLocations();
    const location = FilesManager.getLocationForName(req.params.location);

    if (!location) {
        res.status(404).json({
            error: {
                code: 404,
                status: 'Not Found',
                message: "Location not found"
            }
        });
    }

    if (location.type == "user") {
        const serviceName = location.service_name;

        const service = new Service(user.user_id, 'fileserver', serviceName);
        service.loadInfo().then(result => {
            var directory = location.directory.replace("%username%", service.service_user_id);
            if (dir !== undefined) {
                directory += '/' + dir;
            }

            sendFiles(location, dir, FileIterator.iterateDirectory(directory, pattern).map(value => {
                return path.basename(value);
            }));
        });
    } else {
        var directory = location.directory;
        if (dir !== undefined) {
            directory += '/' + dir;
        }

        sendFiles(location, dir, FileIterator.iterateDirectory(directory, pattern).map(value => {
            return path.basename(value);
        }));
    }
}
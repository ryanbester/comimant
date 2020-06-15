/*
Copyright (C) 2019-2020 Bester Intranet
*/

const { ServiceManager, Service } = require("./myaccount/servicemanager");
const { glob } = require('glob');

module.exports.FileLocation = class FileLocation {
    constructor(directory, type, title, name, service_name) {
        this.directory = directory;
        this.type = type;
        this.title = title;
        this.name = name;
        this.service_name = service_name;
    }
}

module.exports.FilesManager = class FilesManager {
    static getFileLocations() {
        FilesManager.locations = [];

        var locationsJson = JSON.parse(process.env.FILES);

        for (var i = 0; i < locationsJson.length; i++) {
            var location = locationsJson[i];

            FilesManager.locations.push(new exports.FileLocation(location.directory, location.type, location.title, location.name, location.service_name));
        }

        return FilesManager.locations;
    }

    static getLocationForName(name) {
        if (FilesManager.locations === undefined) {
            return null;
        }

        for (var i = 0; i < FilesManager.locations.length; i++) {
            if (FilesManager.locations[i].name == name) {
                return FilesManager.locations[i];
            }
        }

        return null;
    }
}

module.exports.FileIterator = class FileIterator {
    static iterateDirectory(directory, pattern) {
        if (pattern === undefined) {
            pattern = '*';
        }

        return glob.sync(directory + '/' + pattern);
    }
}
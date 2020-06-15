/*
Copyright (C) 2019-2020 Bester Intranet
*/

const trailingSlash = string => {
    if (!string.endsWith('/')) {
        return string + '/';
    }

    return string;
}

const getFileLocations = _ => {
    fetch('/api/internal/files/locations').then(res => {
        res.json().then(json => {
            var table = $('#file-locations-table').get(0);

            json.forEach(location => {
                var tableRow = document.createElement('tr');

                var titleFieldLink = document.createElement('a');
                titleFieldLink.setAttribute('href', '/files/' + location.name);
                titleFieldLink.setAttribute('title', location.title);
                titleFieldLink.innerHTML = location.title;

                var titleField = document.createElement('td');
                titleField.appendChild(titleFieldLink);

                tableRow.appendChild(titleField)

                table.appendChild(tableRow);
            });
        });
    }).catch(error => {
        // TODO: Handle errors
    });
}

const getFiles = (location, path) => {
    fetch('/api/internal/files/locations/' + location + "/files?path=" + decodeURIComponent(path)).then(res => {
        res.json().then(json => {
            var table = $('#file-files-table').get(0);
            json.files.forEach(file => {
                var tableRow = document.createElement('tr');

                var titleFieldLink = document.createElement('a');
                titleFieldLink.setAttribute('href', trailingSlash(document.location.pathname) + file);
                titleFieldLink.setAttribute('title', file);
                titleFieldLink.innerHTML = file;

                var titleField = document.createElement('td');
                titleField.appendChild(titleFieldLink);

                tableRow.appendChild(titleField)

                table.appendChild(tableRow);
            });
        });
    }).catch(error => {
        // TODO: Handle errors
    });
}

$(document).ready(_ => {
    var currentPath = document.location.pathname.replace('/files', '');
    
    if (currentPath == '') {
        getFileLocations();
    } else {
        currentPath = currentPath.replace('/', '');
        var parts = currentPath.split('/');
        var locationName = parts[0];

        parts.shift();
        var pathName = parts.join('/');

        getFiles(locationName, pathName);
    }
});
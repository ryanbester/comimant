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

widget.widgetMethods.newsWidget = function (data, container) {
    if (!data.hasOwnProperty('source')) {
        container.innerHTML = '<p>Cannot get news</p>';
    }

    let url;

    switch (data.source) {
        case 'google-news':
            url = 'https://news.google.com/rss';
            break;
        default:
            container.innerHTML = '<p>Unknown news source</p>';
    }

    if (url !== undefined) {
        /*fetch('/api/internal/rss/?url=' + url + '&items=3').then(async res => {
            if (res.ok) {
                await res.json().then(json => {
                    let html = `
                    <div class="home-page-widget-news-container">
                    `;

                    for (var i = 0; i < json.items.length; i++) {
                        html += `
                        <div class="home-page-widget-news-container-item">
                            <h2><a target="_blank" href="` + json.items[i].link + `">` + json.items[i].title + `</a></h2>
                        </div>
                        `;
                    }

                    html += '</div>';

                    container.innerHTML = html;
                });
            } else {
                container.innerHTML = '<p>Cannot get news</p>';
            }
        }).catch(e => {
            container.innerHTML = '<p>Cannot get news</p>';
        });*/
        container.innerHTML = '<p>Not implemented</p>';
    }
};

widget.widgetMethods.newsProperties = function (container, action, widgetObj) {
    const updateWidgetContent = function () {
        widget.getContent('news', {
            source: $('#widget-' + action + '-dialog-news-source').val()
        }, $('#widget-' + action + '-dialog-preview .home-page-grid-container__widget-content').get(0));
    };

    if (widgetObj === undefined) {
        container.innerHTML = `
                <label for="widget-${action}-dialog-news-source">Source</label>
                <select id="widget-${action}-dialog-news-source">
                    <option value="google-news">Google News</option>
                </select>
            `;
    } else {
        container.innerHTML = `
                <label for="widget-${action}-dialog-news-source">Source</label>
                <select id="widget-${action}-dialog-news-source">
                    <option ` + (widgetObj.data.source === 'google-news' ? 'selected' : '') + ` value="google-news">Google News</option>
                </select>
            `;
    }

    updateWidgetContent();

    $('#widget-' + action + '-dialog-news-source').change(function () {
        updateWidgetContent();
    });
};

widget.widgetMethods.parseNewsProperties = function (properties, html) {
    const data = {};

    for (let i = 0; i < properties.length; i++) {
        if (properties[i].id === 'widget-add-dialog-news-source'
            || properties[i].id === 'widget-edit-dialog-news-source') {
            data.source = properties[i].value;
        }
    }

    return data;
};

/*
Copyright (C) 2019-2020 Bester Intranet
*/

var editWidgetDialog = function(){
    var dialog = {
        created : function(widget){
            this.getProperties(widget);

            this.setPreviewTitle($('#widget-edit-dialog-title').val());

            $('#widget-edit-dialog-title').keyup($.debounce(250, _ => {
                this.setPreviewTitle($('#widget-edit-dialog-title').val());
            }));
        },
        getProperties : function(widget) {
            var container = document.getElementById('widget-edit-dialog-properties-container');

            switch(widget.type) {
                case 'weather':
                    this.weatherProperties(container, widget);
                    break;
                case 'news':
                    this.newsProperties(container, widget);
                    break;
                default:
                    container.innerHTML = "<p id=\"widget-edit-dialog-properties-message\">Unknown widget type</p>"
            }
        },
        weatherProperties : function(container, widget) {
            const updateWidgetContent = _ => {
                getWidgetContent('weather', {
                    location: $('#widget-edit-dialog-weather-location').val(),
                    units: $('input[name=widget-edit-dialog-weather-temperature]:checked').val(),
                    source: $('#widget-edit-dialog-weather-source').val()
                }, $('#widget-edit-dialog-preview .home-page-grid-container__widget-content').get(0));
            }

            container.innerHTML = `
                <label for="widget-edit-dialog-weather-source">Source</label>
                <select id="widget-edit-dialog-weather-source">
                    <option ` + (widget.data.source == 'openweathermap' ? 'selected' : '') + ` value="openweathermap">OpenWeatherMap</option>
                </select>
                <br />
                <label for="widget-edit-dialog-weather-location">Location</label>
                <input id="widget-edit-dialog-weather-location" type="text" placeholder="Location" class="inline" value="` + widget.data.location + `" />
                <br />
                <label class="radio-container inline">&deg;C
                    <input ` + (widget.data.units == 'c' ? 'checked' : '') + ` type="radio" id="widget-edit-dialog-weather-temperature-celsius" name="widget-edit-dialog-weather-temperature" value="c" checked>
                    <span class="radio-checkmark"></span>
                </label>
                <label class="radio-container inline">&deg;F
                    <input ` + (widget.data.units == 'f' ? 'checked' : '') + ` type="radio" id="widget-edit-dialog-weather-temperature-fahrenheit" name="widget-edit-dialog-weather-temperature" value="f">
                    <span class="radio-checkmark"></span>
                </label>
            `
            
            updateWidgetContent();

            $('#widget-edit-dialog-weather-source').change(e => {
                updateWidgetContent();
            });

            $('#widget-edit-dialog-weather-location').keyup($.debounce(250, _ => {
                updateWidgetContent();
            }));

            $('input[name=widget-edit-dialog-weather-temperature]').change(e => {
                updateWidgetContent();
            });
        },
        newsProperties : function(container, widget) {
            const updateWidgetContent = _ => {
                getWidgetContent('news', {
                    source: $('#widget-edit-dialog-news-source').val()
                }, $('#widget-edit-dialog-preview .home-page-grid-container__widget-content').get(0));
            }

            container.innerHTML = `
                <label for="widget-edit-dialog-news-source">Source</label>
                <select id="widget-edit-dialog-news-source">
                    <option ` + (widget.data.source == 'google-news' ? 'selected' : '') + ` value="google-news">Google News</option>
                </select>
            `
            
            updateWidgetContent();

            $('#widget-edit-dialog-news-source').change(e => {
                updateWidgetContent();
            });
        },
        setPreviewTitle : function(title) {
            if(title != undefined) {
                $('#widget-edit-dialog-preview .home-page-grid-container__widget-title h1').get(0).innerHTML = title;
            }
        }
    };

    return dialog;
}();
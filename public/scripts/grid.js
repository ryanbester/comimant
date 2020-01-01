/*
Copyright (C) 2019-2020 Bester Intranet
*/

function resizeGridItem(item) {
    var grid = document.getElementsByClassName("home-page-grid-container")[0];
    var rowHeight = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-auto-rows'));
    var rowGap = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-row-gap'));

    var height = 100;
    var rowSpan = Math.ceil(height / (rowHeight + rowGap));

    item.style.gridRowEnd = "span " + rowSpan;
}

function resizeAllGridItems() {
    var allItems = document.getElementsByClassName("home-page-grid-container__widget");
    
    Array.prototype.forEach.call(allItems, function(item) {
        resizeGridItem(item);
    });
}

$(document).ready(_ => {
    resizeAllGridItems();
});

//window.addEventListener("resize", resizeAllGridItems);

var widgetGrid = (function() {
    var grid = {
        addWidget : function(widget_id, height) {
            var widget = document.createElement('div');
            widget.setAttribute('class', 'home-page-grid-container__widget loading');

            widget.setAttribute('data-id', widget_id);

            var widgetContent = document.createElement('div');
            widgetContent.setAttribute('class', 'home-page-grid-container__widget-content');

            var container = document.getElementsByClassName('home-page-grid-container')[0];
            var rowHeight = parseInt(window.getComputedStyle(container).getPropertyValue('grid-auto-rows'));
            var rowGap = parseInt(window.getComputedStyle(container).getPropertyValue('grid-row-gap'));

            var rowSpan = Math.ceil(height / (rowHeight + rowGap));
            widget.style.gridRowEnd = "span " + rowSpan;

            widget.appendChild(widgetContent);

            container.appendChild(widget);
        },
        addWidgetBtn : function(addWidgetBtnCallback) {
            var widget = document.createElement('div');
            widget.setAttribute('class', 'home-page-grid-container__widget home-page-grid-container__widget--add');
            widget.setAttribute('id', 'add-widget-btn');

            var widgetContent = document.createElement('div');
            widgetContent.setAttribute('class', 'home-page-grid-container__widget-content');

            var link = document.createElement('a');
            link.setAttribute('class', 'home-page-grid-container__widget__full-link');
            link.setAttribute('href', '');

            var title = document.createElement('h1');
            title.innerHTML = "Add Widget";

            var container = document.getElementsByClassName('home-page-grid-container')[0];
            var rowHeight = parseInt(window.getComputedStyle(container).getPropertyValue('grid-auto-rows'));
            var rowGap = parseInt(window.getComputedStyle(container).getPropertyValue('grid-row-gap'));

            var rowSpan = Math.ceil(100 / (rowHeight + rowGap));
            widget.style.gridRowEnd = "span " + rowSpan;

            link.appendChild(title);
            widgetContent.appendChild(link);
            widget.appendChild(widgetContent);

            container.appendChild(widget);

            $('#add-widget-btn').click((e) => {
                addWidgetBtnCallback(e);
            });
        },
        loadWidgets : function() {
            var container = document.getElementsByClassName('home-page-grid-container')[0];

            var widgets = container.childNodes;

            widgets.forEach(widget => {
                if(!widget.classList.contains('home-page-grid-container__widget--add')) {
                    var widget_id = widget.getAttribute('data-id');

                    fetch('/api/internal/widgets/' + widget_id).then(res => {
                        res.json().then(json => {
                            var title = document.createElement('h1');
                            
                            var titleText = document.createTextNode(json.widget.title);

                            title.appendChild(titleText);

                            widget.setAttribute('class', 'home-page-grid-container__widget');
                            widget.childNodes[0].appendChild(title);
                        });
                    }).catch(e => {
                        console.log(e);
                    });
                }
            });
        }
    };

    return grid;
})();
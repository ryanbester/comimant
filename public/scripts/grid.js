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

            var container = document.getElementsByClassName('home-page-grid-container')[0];
            var rowHeight = parseInt(window.getComputedStyle(container).getPropertyValue('grid-auto-rows'));
            var rowGap = parseInt(window.getComputedStyle(container).getPropertyValue('grid-row-gap'));

            var rowSpan = Math.ceil(height / (rowHeight + rowGap));
            widget.style.gridRowEnd = "span " + rowSpan;

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
                            var titleContainer = document.createElement('div');
                            titleContainer.setAttribute('class', 'home-page-grid-container__widget-title');

                            var title = document.createElement('h1');
                            
                            var titleText = document.createTextNode(json.widget.title);

                            title.appendChild(titleText);

                            titleContainer.appendChild(title);
                            
                            this.createWidgetMenu(widget_id, titleContainer);

                            var widgetContent = document.createElement('div');
                            widgetContent.setAttribute('class', 'home-page-grid-container__widget-content');

                            widget.setAttribute('class', 'home-page-grid-container__widget');
                            widget.appendChild(titleContainer);
                            widget.appendChild(widgetContent);
                        });
                    }).catch(e => {
                        console.log(e);
                    });
                }
            });
        },
        createWidgetMenu : function(widget_id, container) {
            var menuContainer = document.createElement('div');
            menuContainer.setAttribute('class', 'home-page-grid-container__widget-menu-container');

            var menuBtn = document.createElement('div');
            menuBtn.setAttribute('class', 'home-page-grid-container__widget-menu-btn');

            $(menuBtn).click(e => {
                $(e.target).next().children('.home-page-grid-container__widget-menu-list').fadeToggle(250);
            });

            var menu = document.createElement('div');
            menu.setAttribute('class', 'home-page-grid-container__widget-menu');

            var menuList = document.createElement('ul');
            menuList.setAttribute('class', 'home-page-grid-container__widget-menu-list');

            var sizeItem = document.createElement('li');
            sizeItem.setAttribute('class', 'home-page-grid-container__widget-menu-item');
            sizeItem.innerHTML = "Size";
            menuList.appendChild(sizeItem);

            var positionItem = document.createElement('li');
            positionItem.setAttribute('class', 'home-page-grid-container__widget-menu-item');
            positionItem.innerHTML = "Position";
            menuList.appendChild(positionItem);

            var deleteItem = document.createElement('li');
            deleteItem.setAttribute('class', 'home-page-grid-container__widget-menu-item delete');
            deleteItem.innerHTML = "Delete";
            menuList.appendChild(deleteItem);

            menu.appendChild(menuList);

            menuContainer.appendChild(menuBtn);
            menuContainer.appendChild(menu);

            container.appendChild(menuContainer);
        }
    };

    return grid;
})();
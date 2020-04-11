/*
Copyright (C) 2019-2020 Bester Intranet
*/

function resizeGridItem(item, height) {
    var grid = document.getElementsByClassName("home-page-grid-container")[0];
    var rowHeight = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-auto-rows'));
    var rowGap = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-row-gap'));

    if (height == undefined) {
        var height = 100;
    }
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

//var widgets = [];

//window.addEventListener("resize", resizeAllGridItems);

var widgetGrid = (function() {
    var grid = {
        widgets : [],
        getNextPosition : function() {
            return Math.max.apply(Math, this.widgets.map(widget => {
                return widget.position;
            })) + 1;
        },
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
        addLoadedWidget : function(widget_id, title, content, height, widgetMenuItemCallback) {
            var widget = document.createElement('div');
            widget.setAttribute('class', 'home-page-grid-container__widget');

            widget.setAttribute('data-id', widget_id);

            var container = document.getElementsByClassName('home-page-grid-container')[0];
            var rowHeight = parseInt(window.getComputedStyle(container).getPropertyValue('grid-auto-rows'));
            var rowGap = parseInt(window.getComputedStyle(container).getPropertyValue('grid-row-gap'));

            var rowSpan = Math.ceil(height / (rowHeight + rowGap));
            widget.style.gridRowEnd = "span " + rowSpan;

            var titleContainer = document.createElement('div');
            titleContainer.setAttribute('class', 'home-page-grid-container__widget-title');
            titleContainer.innerHTML = title;
            
            this.createWidgetMenu(widget_id, titleContainer, widgetMenuItemCallback);

            var widgetContent = document.createElement('div');
            widgetContent.setAttribute('class', 'home-page-grid-container__widget-content');
            
            widgetContent.innerHTML = content;

            widget.appendChild(titleContainer);
            widget.appendChild(widgetContent);

            container.insertBefore(widget, document.getElementsByClassName('home-page-grid-container__widget--add')[0]);
        },
        updateWidget : function(widget_id, title, content) {
            var container = document.getElementsByClassName('home-page-grid-container')[0];
            var widgets = container.childNodes;

            widgets.forEach(widget => {
                if(!widget.classList.contains('home-page-grid-container__widget--add')) {
                    if(widget.getAttribute('data-id') == widget_id) {
                        widget.getElementsByClassName('home-page-grid-container__widget-title')[0].getElementsByTagName('h1')[0].innerHTML = title;
                        widget.getElementsByClassName('home-page-grid-container__widget-content')[0].innerHTML = content;
                    }
                }
            });
        },
        deleteWidget : function(widget_id) {
            var container = document.getElementsByClassName('home-page-grid-container')[0];
            var widgets = container.childNodes;

            widgets.forEach(widget => {
                if(!widget.classList.contains('home-page-grid-container__widget--add')) {
                    if(widget.getAttribute('data-id') == widget_id) {
                        widget.remove();
                    }
                }
            });
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
        loadWidgets : function(widgetMenuItemCallback) {
            var container = document.getElementsByClassName('home-page-grid-container')[0];

            var widgets = container.childNodes;

            widgets.forEach(widget => {
                if(!widget.classList.contains('home-page-grid-container__widget--add')) {
                    var widget_id = widget.getAttribute('data-id');

                    fetch('/api/internal/widgets/' + widget_id).then(res => {
                        if(res.ok) {
                            res.json().then(json => {
                                this.widgets.push({
                                    "id": widget_id,
                                    "title": json.widget.title,
                                    "type": json.widget.type,
                                    "position": json.widget.position,
                                    "height": json.widget.height,
                                    "data": json.widget.data
                                });
                                
                                var titleContainer = document.createElement('div');
                                titleContainer.setAttribute('class', 'home-page-grid-container__widget-title');

                                var title = document.createElement('h1');
                                
                                var titleText = document.createTextNode(json.widget.title);

                                title.appendChild(titleText);

                                titleContainer.appendChild(title);
                                
                                this.createWidgetMenu(widget_id, titleContainer, widgetMenuItemCallback);

                                var widgetContent = document.createElement('div');
                                widgetContent.setAttribute('class', 'home-page-grid-container__widget-content');

                                getWidgetContent(json.widget.type, json.widget.data, widgetContent);

                                widget.setAttribute('class', 'home-page-grid-container__widget');
                                widget.appendChild(titleContainer);
                                widget.appendChild(widgetContent);
                            });
                        } else {
                            new BINotification('error', "Error loading widget").showNotification();
                        }
                    }).catch(e => {
                        console.log(e);
                    });
                }
            });
        },
        createWidgetMenu : function(widget_id, container, menuCallback) {
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

            var editItem = document.createElement('li');
            editItem.setAttribute('class', 'home-page-grid-container__widget-menu-item');
            editItem.innerHTML = "Edit";
            menuList.appendChild(editItem);

            $(editItem).click((e) => {
                menuCallback(e, widget_id, 'edit');
            });

            var sizeItem = document.createElement('li');
            sizeItem.setAttribute('class', 'home-page-grid-container__widget-menu-item');
            sizeItem.innerHTML = "Size";
            menuList.appendChild(sizeItem);

            $(sizeItem).click((e) => {
                menuCallback(e, widget_id, 'size');
            });

            var positionItem = document.createElement('li');
            positionItem.setAttribute('class', 'home-page-grid-container__widget-menu-item');
            positionItem.innerHTML = "Position";
            menuList.appendChild(positionItem);

            $(positionItem).click((e) => {
                menuCallback(e, widget_id, 'position');
            });

            var deleteItem = document.createElement('li');
            deleteItem.setAttribute('class', 'home-page-grid-container__widget-menu-item delete');
            deleteItem.innerHTML = "Delete";
            menuList.appendChild(deleteItem);

            $(deleteItem).click((e) => {
                menuCallback(e, widget_id, 'delete');
            });

            menu.appendChild(menuList);

            menuContainer.appendChild(menuBtn);
            menuContainer.appendChild(menu);

            container.appendChild(menuContainer);
        },
        resizeWidget : function(widget_id, height, updateCallback) {
            var container = document.getElementsByClassName('home-page-grid-container')[0];
            var widgets = container.childNodes;

            for(var i = 0; i < widgets.length; i++) {
                if(widgets[i].getAttribute('data-id') == widget_id) {
                    resizeGridItem(widgets[i], height);
                    for(var i = 0; i < this.widgets.length; i++) {
                        if(this.widgets[i].id == widget_id) {
                            this.widgets[i].height = height;
                        }
                    }

                    updateCallback([
                        {
                            "id": widget_id,
                            "height": height
                        }
                    ]);
                }
            }
        },
        moveWidget : function(widget_id, position, updateCallback) {
            var container = document.getElementsByClassName('home-page-grid-container')[0];
            var widgets = container.childNodes;

            if(position > (widgets.length - 1)) {
                console.error("Position invalid");
                return false;
            }

            if(position < 1) {
                console.error("Position invalid");
                return false;
            } 

            var widgetFound = false;
            var widgetToRemove;
            var widgetToRemoveAfter;
            var i = 1;
            var offset;

            var widgetsToMoveBehind = [];
            var widgetsToMoveInFront = [];

            var firstAfterFound = true;

            var widgetPosToChange = [];

            widgets.forEach(widget => {
                if(widget.getAttribute('id') != 'add-widget-btn') {
                    if(widgetFound) {
                        widgetsToMoveBehind.push(widget);

                        if(firstAfterFound) {
                            widgetToRemoveAfter = widget;
                            firstAfterFound = false;
                        }
                    }

                    if(widget.getAttribute('data-id') == widget_id) {
                        widgetToRemove = widget;
                        offset = position - i;    
                        widgetFound = true;
                    }

                    if(!widgetFound) {
                        widgetsToMoveInFront.push(widget);
                    }
    
                    i++;
                }
            });

            widgetPosToChange.push(widgetToRemove.getAttribute('data-id'));

            if(offset > 0) {
                for(var i = 0; i < offset; i++) {
                    var widgetToMove = widgetsToMoveBehind[i];
                    container.removeChild(widgetToMove);
                    container.insertBefore(widgetToMove, widgetToRemove);
                    widgetPosToChange.push(widgetToMove.getAttribute('data-id'));
                }
            }
            else if (offset < 0) {
                for(var i = 0; i < widgetsToMoveBehind.length; i++) {
                    widgetPosToChange.push(widgetsToMoveBehind[i].getAttribute('data-id'));
                }

                if(widgetToRemoveAfter === undefined) {
                    widgetToRemoveAfter = widgets[widgets.length - 1];
                }

                for(var i = 0; i < widgetsToMoveInFront.length; i++) {
                    if(i >= widgetsToMoveInFront.length - Math.abs(offset)) {
                        var widgetToMove = widgetsToMoveInFront[i];
                        container.removeChild(widgetToMove);
                        container.insertBefore(widgetToMove, widgetToRemoveAfter);
                        widgetPosToChange.push(widgetToMove.getAttribute('data-id'));
                    }
                }
            }

            var callbackWidgets = [];

            for(var i = 0; i < this.widgets.length; i++) {
                if(widgetPosToChange.includes(this.widgets[i].id)) {
                    for(var j = 0; j < widgets.length; j++) {
                        if(widgets[j].getAttribute('data-id') == this.widgets[i].id) {
                            this.widgets[i].position = j + 1;

                            callbackWidgets.push({
                                "id": this.widgets[i].id,
                                "position": j + 1
                            });
                        }
                    }
                }
            }

            updateCallback(callbackWidgets);
        }
    };

    return grid;
})();
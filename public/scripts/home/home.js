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

const mainContainer = document.getElementsByClassName('main-container')[0];
const path = window.location.pathname;

$(document).ready(_ => {
    checkUser();
    loadSkeleton();
});


const checkUser = _ => {
    timeout(5000, fetch('/usercheck')).then(res => {
        res.json().then(json => {
            if (json.status === true) {
                $('#main-header-user-dropdown__loading').fadeOut(250);
            } else {
                $('#main-header-user-dropdown__loading').fadeOut(250, _ => {
                    $('#main-header-user-dropdown__error').css({
                        opacity: 0,
                        display: 'inline-block'
                    }).animate({ opacity: 1 }, 250);
                });
            }
        });
    }).catch(_ => {
        $('#main-header-user-dropdown__loading').fadeOut(250, _ => {
            $('#main-header-user-dropdown__error').css({
                opacity: 0,
                display: 'inline-block'
            }).animate({ opacity: 1 }, 250);
        });
    });
};

const widgetMenuItemClick = (e, widget_id, action) => {
    e.preventDefault();

    let widget;
    for (let i = 0; i < widgetGrid.widgets.length; i++) {
        if (widgetGrid.widgets[i].id === widget_id) {
            widget = widgetGrid.widgets[i];
        }
    }

    if (action === 'edit') {
        const editWidgetDlg = new ComimantDialog('Edit Widget', `
            <label class="heading" for="widget-edit-dialog-title">Title</label>
            <input type="text" id="widget-edit-dialog-title" placeholder="Title" value="` + widget.title + `">
            <h2>Properties</h2>
            <div id="widget-edit-dialog-properties-container">
                <p id="widget-edit-dialog-properties-message"></p>
            </div>
            <h2>Preview</h2>
            <div id="widget-edit-dialog-preview">
                <div id="widget-edit-dialog-preview-title" class="home-page-grid-container__widget-title">
                    <h1></h1>
                </div>
                <div id="widget-edit-dialog-preview-content" class="home-page-grid-container__widget-content">
                </div>
            </div>
        `, [
            {
                'title': 'Cancel',
                'action': 'cancel'
            },
            {
                'title': 'Save',
                'action': 'save',
                'primary': true
            }
        ]);

        editWidgetDlg.createModal(mainContainer, [
            {
                'id': 'widget-edit-dialog-title',
                'type': 'value'
            },
            {
                'id': 'widget-edit-dialog-properties-container',
                'type': 'html'
            },
            {
                'id': 'widget-edit-dialog-preview-title',
                'type': 'html'
            },
            {
                'id': 'widget-edit-dialog-preview-content',
                'type': 'html'
            }
        ], (action, content) => {
            switch (action) {
                case 'cancel':
                    ComimantDialog.deleteAllDialogs();
                    break;
                case 'save':
                    const properties = [];

                    $('#widget-edit-dialog-properties-container input').each(function () {
                        const inputType = $(this).attr('type');

                        if (inputType === 'radio') {
                            if ($(this).is(':checked')) {
                                properties.push({
                                    id: $(this).attr('name'),
                                    value: $(this).val()
                                });
                            }
                        } else if (inputType === 'checkbox') {
                            if ($(this).is(':checked')) {
                                properties.push({
                                    id: $(this).attr('id'),
                                    value: true
                                });
                            } else {
                                properties.push({
                                    id: $(this).attr('id'),
                                    value: false
                                });
                            }
                        } else {
                            properties.push({
                                id: $(this).attr('id'),
                                value: $(this).val()
                            });
                        }
                    });

                    $('#widget-edit-dialog-properties-container select').each(function () {
                        properties.push({
                            id: $(this).attr('id'),
                            value: $(this).val()
                        });
                    });

                    ComimantDialog.deleteAllDialogs();

                    let title, widgetContent, propertiesHtml;

                    for (let i = 0; i < content.length; i++) {
                        if (content[i].id === 'widget-edit-dialog-preview-title') {
                            title = content[i].content;
                        }

                        if (content[i].id === 'widget-edit-dialog-properties-container') {
                            propertiesHtml = content[i].content;
                        }

                        if (content[i].id === 'widget-edit-dialog-preview-content') {
                            widgetContent = content[i].content;
                        }
                    }

                    const data = parseProperties(widget.type, properties, propertiesHtml);
                    const titleText = new DOMParser().parseFromString(title, 'text/xml').firstChild.innerHTML;

                    const body = new URLSearchParams();
                    body.append('title', titleText);
                    body.append('data', JSON.stringify(data));

                    fetch('/api/internal/widgets/' + widget.id, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'pragma': 'no-cache',
                            'cache-control': 'no-cache'
                        },
                        body: body,
                        redirect: 'follow'
                    }).then(res => {
                        if (!res.ok) {
                            new ComimantNotification('error', 'Error saving widget').showNotification();
                        } else {
                            res.json().then(_ => {
                                for (let i = 0; i < widgetGrid.widgets.length; i++) {
                                    if (widgetGrid.widgets[i].id === widget.id) {
                                        widgetGrid.widgets[i].title = titleText;
                                        widgetGrid.widgets[i].data = data;
                                    }
                                }

                                widgetGrid.updateWidget(widget.id, titleText, widgetContent);

                                // Invalid cache
                                caches.open('static-v1').then(cache => {
                                    fetch('/api/internal/widgets').then(res => {
                                        cache.put('/api/internal/widgets', res.clone());
                                    });
                                });

                                new ComimantNotification('success', 'Saved widget').showNotification();
                            });
                        }
                    }).catch(e => {
                        console.log(e);
                        new ComimantNotification('error', 'Error saving widget').showNotification();
                    });
                    break;
            }
        }, modal => {
            editWidgetDialog.created(widget);
        });

        editWidgetDlg.show();
    } else if (action === 'size') {
        // show size dialog

        const widgetSizeDlg = new ComimantDialog('Widget Size',
            '<label for="widget-size-dialog-height">Height of widget:</label><br /><input type="number" id="widget-size-dialog-height" value="' + widget.height + '">',
            [
                {
                    'title': 'Cancel',
                    'action': 'cancel'
                },
                {
                    'title': 'Save',
                    'action': 'save',
                    'primary': true
                }
            ]);

        widgetSizeDlg.createModal(mainContainer, [
            {
                'id': 'widget-size-dialog-height',
                'type': 'value'
            }
        ], (action, content) => {
            ComimantDialog.deleteAllDialogs();

            switch (action) {
                case 'save':
                    content.forEach(value => {
                        if (value.id === 'widget-size-dialog-height') {
                            widgetGrid.resizeWidget(widget.id, value.content, async ids => {
                                let i;
                                let errorNotiSent = false;

                                const save = async () => {
                                    const body = new URLSearchParams();
                                    body.append('height', ids[i].height);

                                    await fetch('/api/internal/widgets/' + ids[i].id, {
                                        method: 'PUT',
                                        headers: {
                                            'Content-Type': 'application/x-www-form-urlencoded',
                                            'pragma': 'no-cache',
                                            'cache-control': 'no-cache'
                                        },
                                        body: body,
                                        redirect: 'follow'
                                    }).then(res => {
                                        if (!res.ok) {
                                            if (!errorNotiSent) {
                                                new ComimantNotification('error',
                                                    'Error saving widget layout').showNotification();
                                                errorNotiSent = true;
                                            }
                                        }
                                    }).catch(e => {
                                        console.log(e);
                                        if (!errorNotiSent) {
                                            new ComimantNotification('error',
                                                'Error saving widget layout').showNotification();
                                            errorNotiSent = true;
                                        }
                                    });
                                };

                                const headers = new Headers();
                                headers.append('Content-Type', 'application/x-www-form-urlencoded');

                                for (i = 0; i < ids.length; i++) {
                                    await save(ids[i].id, ids[i].height);
                                }

                                if (!errorNotiSent) {
                                    new ComimantNotification('success', 'Saved widget layout').showNotification();
                                    errorNotiSent = true;
                                }

                                // Invalid cache
                                caches.open('static-v1').then(cache => {
                                    fetch('/api/internal/widgets').then(res => {
                                        cache.put('/api/internal/widgets', res.clone());
                                    });
                                });
                            });
                        }
                    });
                    break;
                default:
                    break;
            }
        });

        widgetSizeDlg.show();
    } else if (action === 'position') {
        // show position dialog

        const widgetPosDlg = new ComimantDialog('Widget Position',
            '<label for="widget-pos-dialog-position">Position of widget:</label><br /><input type="number" id="widget-pos-dialog-position" value="' + widget.position + '">',
            [
                {
                    'title': 'Cancel',
                    'action': 'cancel'
                },
                {
                    'title': 'Save',
                    'action': 'save',
                    'primary': true
                }
            ]);

        widgetPosDlg.createModal(mainContainer, [
            {
                'id': 'widget-pos-dialog-position',
                'type': 'value'
            }
        ], (action, content, e) => {
            ComimantDialog.deleteAllDialogs();

            switch (action) {
                case 'save':
                    content.forEach(value => {
                        if (value.id === 'widget-pos-dialog-position') {
                            widgetGrid.moveWidget(widget.id, value.content, async ids => {
                                let errorNotiSent = false;

                                const save = async (id, position) => {
                                    const body = new URLSearchParams();
                                    body.append('position', position.toString().toLowerCase());

                                    await fetch('/api/internal/widgets/' + id, {
                                        method: 'PUT',
                                        headers: {
                                            'Content-Type': 'application/x-www-form-urlencoded',
                                            'pragma': 'no-cache',
                                            'cache-control': 'no-cache'
                                        },
                                        body: body,
                                        redirect: 'follow'
                                    }).then(res => {
                                        if (!res.ok) {
                                            if (!errorNotiSent) {
                                                new ComimantNotification('error',
                                                    'Error saving widget layout').showNotification();
                                                errorNotiSent = true;
                                            }
                                        }
                                    }).catch(e => {
                                        console.log(e);
                                        if (!errorNotiSent) {
                                            new ComimantNotification('error',
                                                'Error saving widget layout').showNotification();
                                            errorNotiSent = true;
                                        }
                                    });
                                };

                                for (let i = 0; i < ids.length; i++) {
                                    await save(ids[i].id, ids[i].position);
                                }

                                if (!errorNotiSent) {
                                    new ComimantNotification('success', 'Saved widget layout').showNotification();
                                }

                                // Invalidate cache
                                caches.open('static-v1').then(cache => {
                                    fetch('/api/internal/widgets').then(res => {
                                        cache.put('/api/internal/widgets', res.clone());
                                    });
                                });
                            });
                        }
                    });
                    break;
                default:
                    break;
            }
        });

        widgetPosDlg.show();
    } else if (action === 'delete') {
        const deleteWidgetDlg = new ComimantDialog('Delete Widget',
            '<p>Are you sure you want to delete the widget: ' + widget.title + '?</p>', [
                {
                    'title': 'No',
                    'action': 'no',
                    'primary': true
                },
                {
                    'title': 'Yes',
                    'action': 'yes',
                    'destructive': true
                }
            ]);

        deleteWidgetDlg.createModal(mainContainer, [], (action) => {
            ComimantDialog.deleteAllDialogs();

            switch (action) {
                case 'yes':
                    let widgetFound = false;
                    let widgetIndexToRemove;
                    const widgetsToMove = [];

                    widgetGrid.widgets.sort((a, b) => {
                        return a.position - b.position;
                    });

                    for (let i = 0; i < widgetGrid.widgets.length; i++) {
                        if (widgetFound === true) {
                            widgetGrid.widgets[i].position -= 1;

                            widgetsToMove.push({
                                id: widgetGrid.widgets[i].id,
                                position: widgetGrid.widgets[i].position
                            });
                        }

                        if (widgetGrid.widgets[i].id === widget.id) {
                            widgetIndexToRemove = i;
                            widgetFound = true;
                        }
                    }

                    widgetGrid.widgets.splice(widgetIndexToRemove, 1);
                    widgetGrid.deleteWidget(widget.id);

                    let errorNotiSent = false;

                    fetch('/api/internal/widgets/' + widget.id, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'pragma': 'no-cache',
                            'cache-control': 'no-cache'
                        },
                        redirect: 'follow'
                    }).then(async res => {
                        if (!res.ok) {
                            if (!errorNotiSent) {
                                new ComimantNotification('error', 'Error deleting widget').showNotification();
                                errorNotiSent = true;
                            }
                        } else {
                            const move = async (id, position) => {
                                const body = new URLSearchParams();
                                body.append('position', position);

                                await fetch('/api/internal/widgets/' + id, {
                                    method: 'PUT',
                                    headers: {
                                        'Content-Type': 'application/x-www-form-urlencoded',
                                        'pragma': 'no-cache',
                                        'cache-control': 'no-cache'
                                    },
                                    body: body,
                                    redirect: 'follow'
                                }).then(res => {
                                    if (!res.ok) {
                                        if (!errorNotiSent) {
                                            new ComimantNotification('error',
                                                'Error saving widget layout').showNotification();
                                            errorNotiSent = true;
                                        }
                                    }
                                }).catch(e => {
                                    console.log(e);
                                    if (!errorNotiSent) {
                                        new ComimantNotification('error',
                                            'Error saving widget layout').showNotification();
                                        errorNotiSent = true;
                                    }
                                });
                            };

                            for (let i = 0; i < widgetsToMove.length; i++) {
                                await move(widgetsToMove[i].id, widgetsToMove[i].position);
                            }

                            if (!errorNotiSent) {
                                new ComimantNotification('success', 'Saved widget layout').showNotification();
                                errorNotiSent = true;
                            }

                            // Invalid cache
                            caches.open('static-v1').then(cache => {
                                fetch('/api/internal/widgets').then(res => {
                                    cache.put('/api/internal/widgets', res.clone());
                                });
                            });
                        }
                    }).catch(_ => {
                        if (!errorNotiSent) {
                            new ComimantNotification('error', 'Error deleting widget').showNotification();
                            errorNotiSent = true;
                        }
                    });

                    break;
                default:
                    break;
            }
        });

        deleteWidgetDlg.show();
    }
};

const loadSkeleton = _ => {
    fetch('/api/internal/widgets').then(res => {
        if (res.ok) {
            res.json().then(json => {
                json.widgets.sort((a, b) => {
                    return a.position - b.position;
                });

                for (let i = 0; i < json.widgets.length; i++) {
                    const widget = json.widgets[i];

                    if (widget.position === undefined || widget.position == null) {
                        continue;
                    }

                    if (widget.position === 0 || widget.position === '0') {
                        continue;
                    }

                    widgetGrid.addWidget(widget.widget_id, widget.height);
                }

                widgetGrid.addWidgetBtn((e) => {
                    e.preventDefault();

                    navigateWithoutRefresh('/add', '', {
                        'action': 'add-widget'
                    });

                    showAddWidgetDialog();
                });

                widgetGrid.loadWidgets(widgetMenuItemClick);
            });
        } else {
            new ComimantNotification('error', 'Error loading widgets').showNotification();
        }
    }).catch(e => {
        console.log(e);
    });
};

const showAddWidgetDialog = _ => {
    const addWidgetDlg = new ComimantDialog('Add Widget', `
        <label class="heading" for="widget-add-dialog-title">Title</label>
        <input type="text" id="widget-add-dialog-title" placeholder="Title">
        <h2>Widget Type</h2>
        <input type="hidden" id="widget-add-dialog-type" />
        <div class="widget-add-dialog-type-container">
            <div class="widget-add-dialog-type-container__item" data-type="weather">
                <img class="widget-add-dialog-type-container__item-image" src="https://static.besterintranet.com/assets/images/placeholder.png">
                <p class="widget-add-dialog-type-container__item-text">Weather</p>
            </div>
            <div class="widget-add-dialog-type-container__item" data-type="news">
                <img class="widget-add-dialog-type-container__item-image" src="https://static.besterintranet.com/assets/images/placeholder.png">
                <p class="widget-add-dialog-type-container__item-text">News</p>
            </div>
            <div class="widget-add-dialog-type-container__item" data-type="sports">
                <img class="widget-add-dialog-type-container__item-image" src="https://static.besterintranet.com/assets/images/placeholder.png">
                <p class="widget-add-dialog-type-container__item-text">Sports</p>
            </div>
            <div class="widget-add-dialog-type-container__item" data-type="heating">
                <img class="widget-add-dialog-type-container__item-image" src="https://static.besterintranet.com/assets/images/placeholder.png">
                <p class="widget-add-dialog-type-container__item-text">Heating</p>
            </div>
            <div class="widget-add-dialog-type-container__item" data-type="web-feed">
                <img class="widget-add-dialog-type-container__item-image" src="https://static.besterintranet.com/assets/images/placeholder.png">
                <p class="widget-add-dialog-type-container__item-text">Web Feed</p>
            </div>
            <div class="widget-add-dialog-type-container__item" data-type="ebay">
                <img class="widget-add-dialog-type-container__item-image" src="https://static.besterintranet.com/assets/images/placeholder.png">
                <p class="widget-add-dialog-type-container__item-text">eBay</p>
            </div>
            <div class="widget-add-dialog-type-container__item" data-type="bookmarks">
                <img class="widget-add-dialog-type-container__item-image" src="https://static.besterintranet.com/assets/images/placeholder.png">
                <p class="widget-add-dialog-type-container__item-text">Bookmarks</p>
            </div>
            <div class="widget-add-dialog-type-container__item" data-type="todo">
                <img class="widget-add-dialog-type-container__item-image" src="https://static.besterintranet.com/assets/images/placeholder.png">
                <p class="widget-add-dialog-type-container__item-text">ToDo</p>
            </div>
            <div class="widget-add-dialog-type-container__item" data-type="files">
                <img class="widget-add-dialog-type-container__item-image" src="https://static.besterintranet.com/assets/images/placeholder.png">
                <p class="widget-add-dialog-type-container__item-text">Files</p>
            </div>
            <div class="widget-add-dialog-type-container__item" data-type="email">
                <img class="widget-add-dialog-type-container__item-image" src="https://static.besterintranet.com/assets/images/placeholder.png">
                <p class="widget-add-dialog-type-container__item-text">Email</p>
            </div>
            <div class="widget-add-dialog-type-container__item" data-type="rss">
                <img class="widget-add-dialog-type-container__item-image" src="https://static.besterintranet.com/assets/images/placeholder.png">
                <p class="widget-add-dialog-type-container__item-text">RSS</p>
            </div>
        </div>
        <h2>Properties</h2>
        <div id="widget-add-dialog-properties-container">
            <p id="widget-add-dialog-properties-message">Select a widget type to view properties</p>
        </div>
        <h2>Preview</h2>
        <div id="widget-add-dialog-preview">
            <div id="widget-add-dialog-preview-title" class="home-page-grid-container__widget-title">
                <h1></h1>
            </div>
            <div id="widget-add-dialog-preview-content" class="home-page-grid-container__widget-content">
            </div>
        </div>
    `, [
        {
            'title': 'Cancel',
            'action': 'cancel'
        },
        {
            'title': 'Add',
            'action': 'add',
            'primary': true
        }
    ]);

    addWidgetDlg.createModal(mainContainer, [
        {
            'id': 'widget-add-dialog-title',
            'type': 'value'
        },
        {
            'id': 'widget-add-dialog-type',
            'type': 'value'
        },
        {
            'id': 'widget-add-dialog-properties-container',
            'type': 'html'
        },
        {
            'id': 'widget-add-dialog-preview-title',
            'type': 'html'
        },
        {
            'id': 'widget-add-dialog-preview-content',
            'type': 'html'
        }
    ], (action, content, e) => {
        switch (action) {
            case 'cancel':
                ComimantDialog.deleteAllDialogs();
                navigateWithoutRefresh('/', '');
                break;
            case 'add':
                const height = parseFloat(
                    getComputedStyle(document.getElementById('widget-add-dialog-preview')).height);

                const properties = [];

                $('#widget-add-dialog-properties-container input').each(function () {
                    const inputType = $(this).attr('type');

                    if (inputType === 'radio') {
                        if ($(this).is(':checked')) {
                            properties.push({
                                id: $(this).attr('name'),
                                value: $(this).val()
                            });
                        }
                    } else if (inputType === 'checkbox') {
                        if ($(this).is(':checked')) {
                            properties.push({
                                id: $(this).attr('id'),
                                value: true
                            });
                        } else {
                            properties.push({
                                id: $(this).attr('id'),
                                value: false
                            });
                        }
                    } else {
                        properties.push({
                            id: $(this).attr('id'),
                            value: $(this).val()
                        });
                    }
                });

                $('#widget-add-dialog-properties-container select').each(function () {
                    properties.push({
                        id: $(this).attr('id'),
                        value: $(this).val()
                    });
                });

                ComimantDialog.deleteAllDialogs();
                navigateWithoutRefresh('/', '');

                let title, widgetContent, type, propertiesHtml;

                for (let i = 0; i < content.length; i++) {
                    if (content[i].id === 'widget-add-dialog-preview-title') {
                        title = content[i].content;
                    }

                    if (content[i].id === 'widget-add-dialog-type') {
                        type = content[i].content;
                    }

                    if (content[i].id === 'widget-add-dialog-properties-container') {
                        propertiesHtml = content[i].content;
                    }

                    if (content[i].id === 'widget-add-dialog-preview-content') {
                        widgetContent = content[i].content;
                    }
                }

                const data = parseProperties(type, properties, propertiesHtml);
                const position = widgetGrid.getNextPosition();

                const titleText = new DOMParser().parseFromString(title, 'text/xml').firstChild.innerHTML;

                const body = new URLSearchParams();
                body.append('title', titleText);
                body.append('type', type);
                body.append('data', JSON.stringify(data));
                body.append('position', position);
                body.append('height', height);

                fetch('/api/internal/widgets', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'pragma': 'no-cache',
                        'cache-control': 'no-cache'
                    },
                    body: body,
                    redirect: 'follow'
                }).then(res => {
                    if (!res.ok) {
                        new ComimantNotification('error', 'Error saving new widget').showNotification();
                    } else {
                        res.json().then(json => {
                            widgetGrid.widgets.push({
                                'id': json.widget.id,
                                'title': titleText,
                                'type': type,
                                'position': position,
                                'height': height,
                                'data': data
                            });

                            widgetGrid.addLoadedWidget(json.widget.id, title, widgetContent, height,
                                widgetMenuItemClick);

                            // Invalid cache
                            caches.open('static-v1').then(cache => {
                                fetch('/api/internal/widgets').then(res => {
                                    cache.put('/api/internal/widgets', res.clone());
                                });
                            });

                            new ComimantNotification('success', 'Saved new widget').showNotification();
                        });
                    }
                }).catch(e => {
                    console.log(e);
                    new ComimantNotification('error', 'Error saving new widget').showNotification();
                });
                break;
        }
    }, modal => {
        addWidgetDialog.created(modal);
    });

    addWidgetDlg.show();
};

window.onpopstate = (e) => {
    if (e.state) {
        if (e.state.action === 'add-widget') {
            showAddWidgetDialog();
        } else {
            ComimantDialog.deleteAllDialogs();
        }
    } else {
        ComimantDialog.deleteAllDialogs();
    }
};

if (path.startsWith('/add')) {
    showAddWidgetDialog();
}
/*
Copyright (C) 2019-2020 Bester Intranet
*/

var mainContainer = document.getElementsByClassName('main-container')[0];
const path = window.location.pathname;

const timeout = (ms, promise) => {
    return new Promise((resolve, reject) => {
        setTimeout(_ => {
            reject(new Error("timeout"));
        }, ms);

        promise.then(resolve, reject);
    });
}

const checkUser = _ => {
    timeout(5000, fetch('/usercheck/')).then(res => {
        res.json().then(json => {
            if(json.status == true){
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
    }).catch(error => {
        $('#main-header-user-dropdown__loading').fadeOut(250, _ => {
            $('#main-header-user-dropdown__error').css({
                opacity: 0,
                display: 'inline-block'
            }).animate({ opacity: 1 }, 250);
        });
    });
}

const loadSkeleton = _ => {
    fetch('/api/internal/widgets/').then(res => {
        if(res.ok) {
            res.json().then(json => {
                json.widgets.sort((a, b) => {
                    return a.position - b.position;
                });

                for(var i = 0; i < json.widgets.length; i++) {
                    var widget = json.widgets[i];

                    if(widget.position === undefined || widget.position == null ) {
                        continue;
                    }

                    if(widget.position == 0 || widget.position == '0') {
                        continue;
                    }

                    widgetGrid.addWidget(widget.widget_id, widget.height);
                }

                widgetGrid.addWidgetBtn(addWidgetClick = (e) => {
                    e.preventDefault();
                    
                    navigateWithoutRefresh('/add', 'Add Widget | Bester Intranet', {
                        'action': 'add-widget'
                    });

                    showAddWidgetDialog();
                });

                widgetGrid.loadWidgets(menuItemClick = (e, widget_id, action) => {
                    e.preventDefault();

                    var widget;
                    for(var i = 0; i < widgetGrid.widgets.length; i++) {
                        if(widgetGrid.widgets[i].id == widget_id) {
                            widget = widgetGrid.widgets[i];
                        }
                    }

                    if(action == 'edit') {
                        // show edit dialog

                        var widgetEditDlg = new Dialog("Edit Widget", "<p>Edit Widget</p>", [
                            {
                                "title": "Cancel",
                                "action": "cancel"
                            },
                            {
                                "title": "Save",
                                "action": "save",
                                "primary": true
                            }
                        ]);

                        widgetEditDlg.createModal(mainContainer, [], (action, content, e) => {
                            Dialog.deleteAllDialogs();

                            switch(action) {
                                case 'save':
                                    break;
                                default:
                                    break;
                            }
                        });

                        widgetEditDlg.show();
                    } else if(action == 'size') {
                        // show size dialog

                        var widgetSizeDlg = new Dialog("Widget Size", "<p>Height of widget:</p><br /><input type=\"number\" id=\"widget-size-dialog-height\" value=\"" + widget.height + "\">", [
                            {
                                "title": "Cancel",
                                "action": "cancel"
                            },
                            {
                                "title": "Save",
                                "action": "save",
                                "primary": true
                            }
                        ]);

                        widgetSizeDlg.createModal(mainContainer, [
                            {
                                "id": "widget-size-dialog-height",
                                "type": "value"
                            }
                        ], (action, content, e) => {
                            Dialog.deleteAllDialogs();

                            switch(action) {
                                case 'save':
                                    content.forEach(value => {
                                        if(value.id == "widget-size-dialog-height") {
                                            widgetGrid.resizeWidget(widget.id, value.content, async ids => {
                                                var errorNotiSent = false;

                                                const save = async (id, height) => {
                                                    var body = new URLSearchParams();
                                                    body.append("height", ids[i].height);

                                                    await fetch('/api/internal/widgets/' + ids[i].id, {
                                                        method: 'PUT',
                                                        headers: {
                                                            "Content-Type": "application/x-www-form-urlencoded",
                                                            "pragma": "no-cache",
                                                            "cache-control": "no-cache"
                                                        },
                                                        body: body,
                                                        redirect: 'follow'
                                                    }).then(res => {
                                                        if(!res.ok) {
                                                            if(!errorNotiSent) {
                                                                new BINotification('error', "Error saving widget layout").showNotification();
                                                                errorNotiSent = true;
                                                            }
                                                        }
                                                    }).catch(e => {
                                                        console.log(e);
                                                        if(!errorNotiSent) {
                                                            new BINotification('error', "Error saving widget layout").showNotification();
                                                            errorNotiSent = true;
                                                        }
                                                    });
                                                }

                                                var headers = new Headers();
                                                headers.append("Content-Type", "application/x-www-form-urlencoded");

                                                for(var i = 0; i < ids.length; i++) {
                                                    await save(ids[i].id, ids[i].height);
                                                }

                                                if(!errorNotiSent) {
                                                    new BINotification('success', "Saved widget layout").showNotification();
                                                    notificationSent = true;
                                                }

                                                // Invalid cache
                                                caches.open('static-v1').then(cache => {
                                                    fetch('/api/internal/widgets/').then(res => {
                                                        cache.put('/api/internal/widgets/', res.clone());
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
                    } else if (action == 'position') {
                        // show position dialog

                        var widgetPosDlg = new Dialog("Widget Position", "<p>Position of widget:</p><br /><input type=\"number\" id=\"widget-pos-dialog-position\" value=\"" + widget.position + "\">", [
                            {
                                "title": "Cancel",
                                "action": "cancel"
                            },
                            {
                                "title": "Save",
                                "action": "save",
                                "primary": true
                            }
                        ]);

                        widgetPosDlg.createModal(mainContainer, [
                            {
                                "id": "widget-pos-dialog-position",
                                "type": "value"
                            }
                        ], (action, content, e) => {
                            Dialog.deleteAllDialogs();

                            switch(action) {
                                case 'save':
                                    content.forEach(value => {
                                        if(value.id == "widget-pos-dialog-position") {
                                            widgetGrid.moveWidget(widget.id, value.content, async ids => {
                                                var errorNotiSent = false;

                                                const save = async (id, position) => {
                                                    var body = new URLSearchParams();
                                                    body.append("position", position.toString().toLowerCase());

                                                    await fetch('/api/internal/widgets/' + id, {
                                                        method: 'PUT',
                                                        headers: {
                                                            "Content-Type": "application/x-www-form-urlencoded",
                                                            "pragma": "no-cache",
                                                            "cache-control": "no-cache"
                                                        },
                                                        body: body,
                                                        redirect: 'follow'
                                                    }).then(res => {
                                                        if(!res.ok) {
                                                            if(!errorNotiSent) {
                                                                new BINotification('error', "Error saving widget layout").showNotification();
                                                                errorNotiSent = true;
                                                            }
                                                        }
                                                    }).catch(e => {
                                                        console.log(e);
                                                        if(!errorNotiSent) {
                                                            new BINotification('error', "Error saving widget layout").showNotification();
                                                            errorNotiSent = true;
                                                        }
                                                    });
                                                }

                                                for(var i = 0; i < ids.length; i++) {
                                                    await save(ids[i].id, ids[i].position);
                                                }

                                                if(!errorNotiSent) {
                                                    new BINotification('success', "Saved widget layout").showNotification();
                                                }

                                                // Invalid cache
                                                caches.open('static-v1').then(cache => {
                                                    fetch('/api/internal/widgets/').then(res => {
                                                        cache.put('/api/internal/widgets/', res.clone());
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
                    } else if (action == 'delete') {
                        var deleteWidgetDlg = new Dialog("Delete Widget", "<p>Are you sure you want to delete the widget with ID: " + widget.id + "?</p>", [
                            {
                                "title": "No",
                                "action": "no",
                                "primary": true
                            },
                            {
                                "title": "Yes",
                                "action": "yes",
                                "destructive": true
                            }
                        ]);

                        deleteWidgetDlg.createModal(mainContainer, [], (action, content, e) => {
                            Dialog.deleteAllDialogs();

                            switch(action) {                                
                                case 'yes':
                                    console.log("Widget deleted");
                                    break;
                                default:
                                    console.log("Widget deletion aborted by user");
                                    break;
                            }
                        });

                        deleteWidgetDlg.show();
                    }
                });
            });
        } else {
            new BINotification('error', "Error loading widgets").showNotification();
        }
    }).catch(e => {
        console.log(e);
    });
}

$(document).ready(_ => {
    checkUser();

    loadSkeleton();

    /** Update code: */
    /*
    caches.open('static-v1').then(cache => {
        fetch('/api/internal/widgets/').then(res => {
            cache.put('/api/internal/widgets/', res.clone());
        });
    });
    */
});

const navigateWithoutRefresh = (url, title, state) => {
    if(window.history.pushState) {
        window.history.pushState(state, title, url);
    } else {
        if(state != undefined) {
            let params = new URLSearchParams(state).toString();
            window.location.href = url + '?' + params;
        } else {
            window.location.href = url;
        }        
    }
}

const showAddWidgetDialog = _ => {
    var addWidgetDlg = new Dialog("Add Widget", "<p>Coming Soon!</p>", [
        {
            "title": "Cancel",
            "action": "cancel"
        },
        {
            "title": "Add",
            "action": "add",
            "primary": true
        }
    ]);

    addWidgetDlg.createModal(mainContainer, undefined, (action, content, e) => {
        switch(action) {
            case 'cancel':
                Dialog.deleteAllDialogs();

                navigateWithoutRefresh('/', 'Bester Intranet');

                break;
            case 'add':
                console.log(content);
                alert(content);
                break;
        }
    });

    addWidgetDlg.show();
}

window.onpopstate = (e) => {
    if(e.state){
        if(e.state.action == 'add-widget'){
            showAddWidgetDialog();
        } else {
            Dialog.deleteAllDialogs();
        }
    } else {
        Dialog.deleteAllDialogs();
    }
}

if(path.startsWith('/add')) {
    showAddWidgetDialog();
}
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
        res.json().then(json => {
            json.widgets.sort((a, b) => {
                return a.position - b.position;
            });

            for(var i = 0; i < json.widgets.length; i++) {
                var widget = json.widgets[i];

                if(widget.position ===undefined || widget.position == null ) {
                    continue;
                }

                if(widget.position == 0 || widget.position == '0') {
                    continue;
                }

                widgetGrid.addWidget(widget.widget_id, widget.height);
            }

            widgetGrid.addWidgetBtn(addWidgetClick = (e) => {
                e.preventDefault();

                console.log("Test");
                
                navigateWithoutRefresh('/add', 'Add Widget | Bester Intranet', {
                    'action': 'add-widget'
                });

                showAddWidgetDialog();
            });

            widgetGrid.loadWidgets();
        });
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
    var addWidgetDlg = new Dialog("Add Widget", "<p>Test</p>", [
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

    addWidgetDlg.createModal(mainContainer, (action, content, e) => {
        switch(action) {
            case 'cancel':
                Dialog.deleteAllDialogs();

                navigateWithoutRefresh('/', 'Bester Intranet');

                break;
            case 'add':
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
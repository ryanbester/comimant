/*
Copyright (C) 2019 Bester Intranet
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

$(document).ready(_ => {
    checkUser();
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

$('#add-widget-btn').click((e) => {
    e.preventDefault();
    
    navigateWithoutRefresh('/add', 'Add Widget | Bester Intranet', {
        'action': 'add-widget'
    });

    showAddWidgetDialog();
});

if(path.startsWith('/add')) {
    showAddWidgetDialog();
}
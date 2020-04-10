/*
Copyright (C) 2019-2020 Bester Intranet
*/

class Dialog {
    constructor(title, content, buttons) {
        if(title != undefined) {
            this.title = title;
        }

        if(content != undefined) {
            this.content = content;
        }

        if(buttons != undefined) {
            this.buttons = buttons;
        }
    }

    static deleteAllDialogs() {
        var modals = document.getElementsByClassName('modal');

        Array.prototype.forEach.call(modals, function(modal) {
            $(modal).fadeOut(250, _ => {
                modal.parentNode.removeChild(modal);
            });
        });
    }

    createModal(container, returnData, callback, createdCallback) {
        var modal = document.createElement('div');
        modal.setAttribute('class', 'modal');
    
        var modalContent = document.createElement('div');
        modalContent.setAttribute('class', 'modal-content');
    
        var modalTitle = document.createElement('h1');
        modalTitle.setAttribute('class', 'modal__title');
    
        var modalTitleText = document.createTextNode(this.title);
        modalTitle.appendChild(modalTitleText);
    
        var modalActions = document.createElement('div');
        modalActions.setAttribute('class', 'modal__actions');

        this.buttons.forEach(button => {
            var btn = document.createElement('button');

            if(button.primary) {
                btn.setAttribute('class', 'modal__action-button primary');
            } else {
                btn.setAttribute('class', 'modal__action-button');
            }

            if(button.destructive) {
                btn.classList.add('destructive');
            }
    
            btn.addEventListener('click', (e) => {
                var content = [];
                if(returnData !== undefined) {
                    for(var i = 0; i < returnData.length; i++) {
                        let id = returnData[i].id;
                        let type = returnData[i].type;

                        let data = "";

                        if(type == 'value') {
                            data = document.getElementById(id).value;
                        } else if(type == 'outer-html') {
                            data = document.getElementById(id).outerHTML;
                        } else {
                            data = document.getElementById(id).innerHTML;
                        }

                        content.push({
                            "id": id,
                            "content": data
                        });
                    }
                }

                callback(button.action, content, e);
            });
        
            var btnText = document.createTextNode(button.title);
            btn.appendChild(btnText);
        
            modalActions.appendChild(btn);
        }); 
    
        modalContent.innerHTML = this.content;
        modalContent.insertBefore(modalTitle, modalContent.firstChild);
        modalContent.appendChild(modalActions);
    
        modal.appendChild(modalContent);
        container.appendChild(modal);

        this.modal = modal;
        
        if(createdCallback != undefined) {
            createdCallback(modal);
        }
    }

    createModeless() {

    }

    show() {
        $(this.modal).fadeIn(250);
    }
}
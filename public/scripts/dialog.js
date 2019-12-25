/*
Copyright (C) 2019 Bester Intranet
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

    createModal(container, callback) {
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
    
            btn.addEventListener('click', (e) => {
                callback(button.action, modalContent.innerHTML, e);
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
    }

    createModeless() {

    }

    show() {
        $(this.modal).fadeIn(250);
    }
}
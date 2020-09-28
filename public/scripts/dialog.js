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

function ComimantDialog(title, content, buttons) {
    if (title !== undefined) {
        this.title = title;
    }

    if (content !== undefined) {
        this.content = content;
    }

    if (buttons !== undefined) {
        this.buttons = buttons;
    }
}

ComimantDialog.deleteAllDialogs = function () {
    const modals = document.getElementsByClassName('modal');

    Array.prototype.forEach.call(modals, function (modal) {
        $(modal).fadeOut(250, _ => {
            modal.parentNode.removeChild(modal);
        });
    });
};

ComimantDialog.prototype.createModal = function (container, returnData, callback, createdCallback) {
    const modal = document.createElement('div');
    modal.setAttribute('class', 'modal');

    const modalContent = document.createElement('div');
    modalContent.setAttribute('class', 'modal-content');

    const modalTitle = document.createElement('h1');
    modalTitle.setAttribute('class', 'modal__title');

    const modalTitleText = document.createTextNode(this.title);
    modalTitle.appendChild(modalTitleText);

    const modalActions = document.createElement('div');
    modalActions.setAttribute('class', 'modal__actions');

    this.buttons.forEach(button => {
        const btn = document.createElement('button');

        if (button.primary) {
            btn.setAttribute('class', 'modal__action-button primary');
        } else {
            btn.setAttribute('class', 'modal__action-button');
        }

        if (button.destructive) {
            btn.classList.add('destructive');
        }

        btn.addEventListener('click', (e) => {
            const content = [];
            if (returnData !== undefined) {
                for (let i = 0; i < returnData.length; i++) {
                    let id = returnData[i].id;
                    let type = returnData[i].type;

                    let data = '';

                    if (type === 'value') {
                        data = document.getElementById(id).value;
                    } else if (type === 'outer-html') {
                        data = document.getElementById(id).outerHTML;
                    } else {
                        data = document.getElementById(id).innerHTML;
                    }

                    content.push({
                        'id': id,
                        'content': data
                    });
                }
            }

            callback(button.action, content, e);
        });

        const btnText = document.createTextNode(button.title);
        btn.appendChild(btnText);

        modalActions.appendChild(btn);
    });

    modalContent.innerHTML = this.content;
    modalContent.insertBefore(modalTitle, modalContent.firstChild);
    modalContent.appendChild(modalActions);

    modal.appendChild(modalContent);
    container.appendChild(modal);

    this.modal = modal;

    if (createdCallback !== undefined) {
        createdCallback(modal);
    }
};

ComimantDialog.prototype.createModeless = function () {

};

ComimantDialog.prototype.show = function () {
    $(this.modal).fadeIn(250);
};

/*
 * Copyright (C) 2019 - 2020 Comimant
 */

class NotificationManager {
    static notifications = [];
    static nextId = 1;

    static addNotification = () => {
        this.notifications.push({
            'id': this.nextId,
            'visible': true
        });

        this.nextId = this.nextId + 1;
        return this.nextId - 1;
    };

    static setVisibility = (id, visible) => {
        this.notifications.forEach(notification => {
            if (notification.id === id) {
                notification.visible = visible;
            }
        });
    };
}

class ComimantNotification {
    constructor(type, title, message, buttons) {
        if (type !== undefined) {
            this.type = type;
        }

        if (title !== undefined) {
            this.title = title;
        }

        if (message !== undefined) {
            this.message = message;
        }

        if (buttons !== undefined) {
            this.buttons = buttons;
        }
    }

    static deleteNotification(id) {
        const container = document.getElementById('notification-container');
        const notifications = container.childNodes;

        for (let i = 0; i < notifications.length; i++) {
            if (notifications[i].getAttribute('data-id') === id) {
                $(notifications[i]).fadeOut(250);

                NotificationManager.setVisibility(id, false);
            }
        }
    }

    showNotification(callback) {
        const container = document.getElementById('notification-container');

        const notification = document.createElement('div');
        notification.setAttribute('class', 'notification-container__notification');

        if (this.type === 'error') {
            notification.classList.add('notification-container__notification--error');
        } else if (this.type === 'warning') {
            notification.classList.add('notification-container__notification--warning');
        } else if (this.type === 'success') {
            notification.classList.add('notification-container__notification--success');
        }

        const id = NotificationManager.addNotification();
        notification.setAttribute('data-id', id);

        const notificationContent = document.createElement('div');
        notificationContent.setAttribute('class', 'notification-container__notification-content');

        const notificationTitle = document.createElement('div');
        notificationTitle.setAttribute('class', 'notification-container__notification-title');
        const notificationTitleText = document.createElement('h1');
        notificationTitleText.appendChild(document.createTextNode(this.title));
        notificationTitle.appendChild(notificationTitleText);

        const notificationCloseContainer = document.createElement('div');
        notificationCloseContainer.setAttribute('class', 'notification-container__notification-close-container');
        const notificationCloseBtn = document.createElement('div');
        notificationCloseBtn.setAttribute('class', 'notification-container__notification-close');
        notificationCloseBtn.addEventListener('click', (e) => {
            ComimantNotification.deleteNotification(id);
            callback(id, 'close', e);
        });
        notificationCloseContainer.appendChild(notificationCloseBtn);
        notificationTitle.appendChild(notificationCloseContainer);

        notificationContent.appendChild(notificationTitle);

        if (this.message !== undefined) {
            const notificationMessage = document.createElement('p');
            notificationMessage.appendChild(document.createTextNode(this.message));
            notificationContent.appendChild(notificationMessage);
        }

        notification.appendChild(notificationContent);

        if (this.buttons !== undefined) {
            const buttons = document.createElement('div');
            buttons.setAttribute('class', 'notification-container__notification-buttons');

            this.buttons.forEach(button => {
                const buttonElement = document.createElement('div');
                buttonElement.setAttribute('class', 'notification-container__notification-button');

                const buttonText = document.createElement('p');
                buttonText.appendChild(document.createTextNode(button.title));

                buttonElement.appendChild(buttonText);

                buttonElement.addEventListener('click', (e) => {
                    callback(id, button.action, e);
                });

                buttons.appendChild(buttonElement);
                notification.appendChild(buttons);
            });
        }

        container.appendChild(notification);
    }
}
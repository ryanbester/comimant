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

$(function () {
    let usernameInput = $('#login-form__input-username');
    let passwordInput = $('#login-form__input-password');

    if (usernameInput.val().length >= 1) {
        passwordInput.focus();
    } else {
        usernameInput.focus();
    }

    const emailDomainInput = $('#login-form__input-email-domain');
    let currentFocus;

    const openMenu = function () {
        currentFocus = -1;
        $('.login-form__email-domain-dropdown__content').css('display', 'block');
        emailDomainInput.css('border-bottom-right-radius', '0');
    };

    const closeMenu = function () {
        $('.login-form__email-domain-dropdown__content').css('display', 'none');
        emailDomainInput.css('border-bottom-right-radius', '7px');
    };

    emailDomainInput.focus(function () {
        openMenu();
    });

    emailDomainInput.blur(function () {
        closeMenu();
    });

    $('.login-form-email__domain-dropdown__image').click(function () {
        $('#login-form__input-email-domain').focus();
    });

    $('.login-form__email-domain-dropdown-content__list li').on('mousedown', function (event) {
        event.preventDefault();
    }).click(function () {
        emailDomainInput.val($(this).text());
        emailDomainInput.blur();
    });

    document.getElementById('login-form__input-username').addEventListener('keyup', function (e) {
        if (e.code === 'ArrowRight') {
            $('#login-form__input-email-domain').focus();
        }
    });

    document.getElementById('login-form__input-email-domain').addEventListener('keydown', function (e) {
        let x = document.getElementById('login-form__email-dropdown-content__list');
        if (x) {
            x = x.getElementsByTagName('li');
            if (e.code === 'ArrowDown') {
                currentFocus++;
                addActive(x);
            } else if (e.code === 'ArrowUp') {
                currentFocus--;
                addActive(x);
            } else if (e.code === 'Enter') {
                if (currentFocus > -1) {
                    e.preventDefault();
                    if (x) {
                        x[currentFocus].click();
                    }
                }
            }
        }
    });

    function addActive(x) {
        if (!x) {
            return false;
        }
        removeActive(x);
        if (currentFocus >= x.length) {
            currentFocus = 0;
        }
        if (currentFocus < 0) {
            currentFocus = (x.length - 1);
        }

        x[currentFocus].classList.add('login-form__email-domain-dropdown__item--active');
    }

    function removeActive(x) {
        for (let i = 0; i < x.length; i++) {
            x[i].classList.remove('login-form__email-domain-dropdown__item--active');
        }
    }
});
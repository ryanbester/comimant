/*
 * Copyright (C) 2019 - 2020 Comimant
 */

$(function () {
    $('#login-form__input-username').focus();

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
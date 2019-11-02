/*
Copyright (C) 2019 Bester Intranet
*/

$(function(){
    $('#login-form__input-username').focus();

    var currentFocus;

    const openMenu = function(){
        currentFocus = -1;
        $('.login-form__email-domain-dropdown__content').css('display', 'block');
        $('#login-form__input-email-domain').css('border-bottom-right-radius', '0');
    }

    const closeMenu = function(){
        $('.login-form__email-domain-dropdown__content').css('display', 'none');
        $('#login-form__input-email-domain').css('border-bottom-right-radius', '7px');
    }

    $('#login-form__input-email-domain').focus(function(){
        openMenu();
    });

    $('#login-form__input-email-domain').blur(function(){
        closeMenu();
    });

    $('.login-form-email__domain-dropdown__image').click(function(){
        $('#login-form__input-email-domain').focus();
    });

    $('.login-form__email-domain-dropdown-content__list li').on('mousedown', function(event){
        event.preventDefault();
    }).click(function(e){
        $('#login-form__input-email-domain').val($(this).text());
        $('#login-form__input-email-domain').blur();
    });

    document.getElementById('login-form__input-username').addEventListener("keyup", function(e){
        if(e.keyCode == 39){
            $('#login-form__input-email-domain').focus();
        }
    });

    document.getElementById('login-form__input-email-domain').addEventListener("keydown", function (e) {
        var x = document.getElementById('login-form__email-dropdown-content__list');
        if (x) {
            x = x.getElementsByTagName("li");
            if (e.keyCode == 40) {
                currentFocus++;
                addActive(x);
            } else if (e.keyCode == 38) {
                currentFocus--;
                addActive(x);
            } else if (e.keyCode == 13) {
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

        x[currentFocus].classList.add("login-form__email-domain-dropdown__item--active");
    }

    function removeActive(x) {
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("login-form__email-domain-dropdown__item--active");
        }
    }
});
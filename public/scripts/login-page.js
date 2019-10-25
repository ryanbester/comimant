$(function(){
    $('#login-form-input-username').focus();

    var currentFocus;

    $('#login-form-input-email-domain').focus(function(){
        currentFocus = -1;
        $('.login-form-email-domain-dropdown-content').css('display', 'block');
        $('#login-form-input-email-domain').css('border-bottom-right-radius', '0');
    });

    $('#login-form-input-email-domain').blur(function(){
        $('.login-form-email-domain-dropdown-content').css('display', 'none');
        $('#login-form-input-email-domain').css('border-bottom-right-radius', '7px');
    });

    $('.login-form-email-domain-dropdown-image').click(function(){
        $('#login-form-input-email-domain').focus();
    });

    $('.login-form-email-domain-dropdown-content-list li').on('mousedown', function(event){
        event.preventDefault();
    }).click(function(e){
        $('#login-form-input-email-domain').val($(this).text());
        $('#login-form-input-email-domain').blur();
    });

    document.getElementById('login-form-input-email-domain').addEventListener("keydown", function (e) {
        var x = document.getElementById('login-form-email-dropdown-content-list');
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

        x[currentFocus].classList.add("domain-dropdown-active");
    }

    function removeActive(x) {
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("domain-dropdown-active");
        }
    }
});
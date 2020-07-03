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

$(document).ready(function () {
    $('#user-view-options-btn').click(function (e) {
        e.preventDefault();
        const viewOptionsEl = $('#user-view-options');
        const viewOptionsBtn = $('#user-view-options-btn');

        if ($('#user-view-options:visible').length === 0) {
            viewOptionsBtn.addClass('active');
            viewOptionsEl.stop().slideDown(250);
        } else {
            viewOptionsBtn.removeClass('active');
            viewOptionsEl.stop().slideUp(250);
        }
    });

    $('.view-options__checkbox').click(function (e) {
        const checkbox = $(e.target).children('input').get(0);
        if (checkbox === undefined) {
            return;
        }

        // .checked returns false if it's checked for some reason
        if (!checkbox.checked) {
            $(e.target.previousSibling).attr('disabled', true);
        } else {
            $(e.target.previousSibling).removeAttr('disabled');
        }
    });
});

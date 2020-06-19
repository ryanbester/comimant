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

const timeout = (ms, promise) => {
    return new Promise((resolve, reject) => {
        setTimeout(_ => {
            reject(new Error('timeout'));
        }, ms);

        promise.then(resolve, reject);
    });
};

const navigateWithoutRefresh = (url, title, state) => {
    if (window.history.pushState) {
        window.history.pushState(state, title, url);
    } else {
        if (state !== undefined) {
            let params = new URLSearchParams(state).toString();
            window.location.href = url + '?' + params;
        } else {
            window.location.href = url;
        }
    }
};

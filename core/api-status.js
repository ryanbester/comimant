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

module.exports.returnError = (res, code, message) => {
    let status = 'Error';
    switch (code) {
        case 400:
            status = 'Bad Request';
            break;
        case 401:
            status = 'Unauthorised';
            break;
        case 404:
            status = 'Not Found';
            break;
        case 500:
            status = 'Internal Server Error';
            break;
    }

    res.status(code).json({
        error: {
            code: code,
            status: status,
            message: message
        }
    });
};

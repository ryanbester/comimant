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

const { AccessToken } = require('../../../core/auth/access-token');
const { User } = require('../../../core/auth/user');
const { returnError } = require('../../../core/api-status');

const logout = require('../../accounts/logout');

exports.userCheck = (req, res, next) => {
    res.set('Cache-Control', 'no-store');

    if (req.signedCookies['AUTHTOKEN'] === undefined) {
        returnError(res, 401, 'Unauthorised');
    } else {
        const accessToken = new AccessToken(undefined, undefined, req.signedCookies['AUTHTOKEN']);
        accessToken.checkToken().then(_ => {
            const user = new User(accessToken.user_id);
            user.verifyUser().then(_ => {
                user.loadInfo().then(_ => {
                    if (user.locked) {
                        logout.deleteToken(req, res);
                        returnError(res, 401, 'Unauthorised');
                    } else {
                        user.loadPrivileges().then(_ => {
                            res.locals.user = user;
                            next();
                        }, _ => {
                            returnError(res, 401, 'Unauthorised');
                        });
                    }
                }, _ => {
                    returnError(res, 401, 'Unauthorised');
                });
            }, _ => {
                returnError(res, 401, 'Unauthorised');
            });
        }, _ => {
            returnError(res, 401, 'Unauthorised');
        });
    }
};

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

const { Nonce } = require('../../../../core/auth/nonce');

exports.showSecurityPage = (req, res) => {
    Nonce.createNonce('user-logout', '/accounts/logout').then(nonce => {
        res.render('accounts/my-account/security/index', {
            ...res.locals.stdArgs,
            title: 'Security | My Account',
            logoutNonce: nonce,
            activeItem: 'security',
            subtitle: 'Security'
        });
    });
};
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

const { Util } = require('../core/util');
const { Config } = require('../core/config');

module.exports.loadManifest = (req, res) => {
    const config = Config.getInstance();

    res.header('Access-Control-Allow-Origin', '*');
    res.json({
        name: Util.coalesceString(config.getOption('title'), 'Comimant'),
        start_url: res.locals.mainDomain,
        display: 'standalone',
        theme_color: Util.coalesceColour(config.getOption('theme_color'), '#000'),
        background_color: Util.coalesceColour(config.getOption('background_color'), '#FFF'),
        description: Util.coalesceString(config.getOption('description'), 'Comimant'),
        icons: [
            {
                src: res.locals.staticProtocol + res.locals.staticDomain + '/assets/images/logo48x48.png',
                sizes: '48x48',
                type: 'image/png'
            },
            {
                src: res.locals.staticProtocol + res.locals.staticDomain + '/assets/images/logo72x72.png',
                sizes: '72x72',
                type: 'image/png'
            },
            {
                src: res.locals.staticProtocol + res.locals.staticDomain + '/assets/images/logo96x96.png',
                sizes: '96x96',
                type: 'image/png'
            },
            {
                src: res.locals.staticProtocol + res.locals.staticDomain + '/assets/images/logo144x144.png',
                sizes: '144x144',
                type: 'image/png'
            },
            {
                src: res.locals.staticProtocol + res.locals.staticDomain + '/assets/images/logo168x168.png',
                sizes: '168x168',
                type: 'image/png'
            }, {
                src: res.locals.staticProtocol + res.locals.staticDomain + '/assets/images/logo192x192.png',
                sizes: '192x192',
                type: 'image/png'
            }
        ]
    });
};
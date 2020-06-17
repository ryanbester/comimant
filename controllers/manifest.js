/*
 * Copyright (C) 2019 - 2020 Comimant
 */

const { Util } = require('../core/util');
const { Config } = require('../core/config');

module.exports.loadManifest = (req, res) => {
    const config = Config.getInstance();
    const protocol = Util.getProtocol();

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
                src: protocol + res.locals.staticDomain + '/assets/images/logo48x48.png',
                sizes: '48x48',
                type: 'image/png'
            },
            {
                src: protocol + res.locals.staticDomain + '/assets/images/logo72x72.png',
                sizes: '72x72',
                type: 'image/png'
            },
            {
                src: protocol + res.locals.staticDomain + '/assets/images/logo96x96.png',
                sizes: '96x96',
                type: 'image/png'
            },
            {
                src: protocol + res.locals.staticDomain + '/assets/images/logo144x144.png',
                sizes: '144x144',
                type: 'image/png'
            },
            {
                src: protocol + res.locals.staticDomain + '/assets/images/logo168x168.png',
                sizes: '168x168',
                type: 'image/png'
            }, {
                src: protocol + res.locals.staticDomain + '/assets/images/logo192x192.png',
                sizes: '192x192',
                type: 'image/png'
            }
        ]
    });
};
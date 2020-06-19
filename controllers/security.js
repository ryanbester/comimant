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

const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const { Logger } = require('../core/logger');
const { Nonce } = require('../core/auth/nonce');
const { AccessToken } = require('../core/auth/access-token');
const { Util } = require('../core/util');

exports.processLayers = (req, res, next) => {
    let security;

    let securityLayers = 0;
    let layers;

    switch (req.hostname) {
        case res.locals.mainDomain:
            ({ security } = res.locals.mainDomainObj);

            if (security !== undefined) {
                ({ layers } = security);
                if (layers !== undefined) {
                    securityLayers = layers.length;
                }
            }
            break;
        case res.locals.staticDomain:
            ({ security } = res.locals.staticDomainObj);

            if (security !== undefined) {
                ({ layers } = security);
                if (layers !== undefined) {
                    securityLayers = layers.length;
                }
            }
            break;
        case res.locals.authDomain:
            ({ security } = res.locals.authDomainObj);

            if (security !== undefined) {
                ({ layers } = security);
                if (layers !== undefined) {
                    securityLayers = layers.length;
                }
            }
            break;
        case res.locals.accountsDomain:
            ({ security } = res.locals.accountsDomainObj);

            if (security !== undefined) {
                ({ layers } = security);
                if (layers !== undefined) {
                    securityLayers = layers.length;
                }
            }
            break;
    }

    // There are no additional layers to verify, so continue the response.
    if (securityLayers === 0) {
        next();
        return;
    }

    if (layers !== undefined) {
        (async (layers) => {
            return new Promise((resolve, reject) => {
                const renderSecurityError = (message) => {
                    res.status(401).render('error-custom', {
                        title: 'Security Error',
                        error: {
                            title: 'Authentication Error',
                            message: message
                        }
                    });
                };

                let promises = [];
                for (let i = 0; i < layers.length; i++) {
                    promises.push(new Promise((resolve, reject) => {
                        const { type, aud, certs_url, token } = layers[i];

                        if (type === 'jwt') {
                            const { type: tokenType, name: tokenName } = token;

                            const client = jwksClient({
                                cache: true,
                                rateLimit: true,
                                jwksRequestsPerMinute: 10,
                                jwksUri: certs_url
                            });

                            client.getSigningKeys((err, keys) => {
                                if (err) {
                                    reject('Cannot validate JWT');
                                } else {
                                    let token;
                                    if (tokenType === 'cookie') {
                                        token = req.cookies[tokenName];
                                    } else if (tokenType === 'header') {
                                        token = req.headers[tokenName];
                                    } else {
                                        Logger.error('Unknown token type: ' + tokenType);
                                        resolve();
                                    }

                                    if (token !== undefined) {
                                        // Validate token
                                        keys.forEach(key => {
                                            let publicKey = key.getPublicKey();

                                            let options = {};
                                            if (aud !== undefined) {
                                                options['audience'] = aud;
                                            }

                                            jwt.verify(token, publicKey, options, (err, _) => {
                                                if (!err) {
                                                    resolve();
                                                }
                                            });

                                            reject('Cannot validate JWT');
                                        });
                                    } else {
                                        reject('JWT token not set');
                                    }
                                }
                            });
                        } else {
                            Logger.error('Unknown security layer type: ' + type);
                            resolve();
                        }
                    }));
                }

                Promise.all(promises).then(_ => {
                    resolve();
                }, err => {
                    renderSecurityError(err);
                    reject(err);
                });
            });
        })(layers).then(_ => {
            next();
        }, _ => {

        });
    } else {
        next();
    }
};
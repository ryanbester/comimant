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

const { Domains } = require('../../../core/domains');
const { Sanitizer } = require('../../../core/sanitizer');
const { returnError } = require('../../../core/api-status');

exports.getDomains = (req, res) => {
    const domainsObj = new Domains(req.hostname);

    const domains = {};

    Object.keys(domainsObj.domainObject).forEach(key => {
        if (key === 'root') {
            return;
        }

        domains[key] = domainsObj.domainObject[key].domain;
        domains[key + '_protocol'] = domainsObj.domainObject[key].security.ssl_enabled ? "https://" : "http://";
    });

    res.status(200).type('application/javascript').send('const domains = ' + JSON.stringify({
        host: domainsObj.host,
        domains: domains
    }, undefined, '  '));
};

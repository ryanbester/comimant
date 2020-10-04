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

const { Util } = require('../../core/util');
const assert = require('chai').assert;

describe('Util', function () {
    describe('.getFullPath()', function () {
        it('should return the path as is', function () {
            const originalUrl = '/admin/users';
            assert.equal(Util.getFullPath(originalUrl), '/admin/users');
        });

        it('should return the path without query params', function () {
            const originalUrl = '/admin/users?page=2&limit=20';
            assert.equal(Util.getFullPath(originalUrl), '/admin/users');
        });
    });

    describe('.getCallerFile()', function () {
        it('should return the caller file (mocha runnable.js)', function () {
            const callerFile = Util.getCallerFile();
            assert.isString(callerFile);
            assert.isTrue(callerFile.endsWith('runnable.js'));
        });
    });

    describe('.getProtocol()', function () {
        it('should return "https://"', function () {
            const protocol = Util.getProtocol({});
            assert.isString(protocol);
            assert.equal(protocol, 'https://');
        });

        it('should return "https://"', function () {
            const protocol = Util.getProtocol({ security: { ssl_enabled: true } });
            assert.isString(protocol);
            assert.equal(protocol, 'https://');
        });

        it('should return "http://"', function () {
            const protocol = Util.getProtocol({ security: { ssl_enabled: false } });
            assert.isString(protocol);
            assert.equal(protocol, 'http://');
        });
    });

    describe('.nullCoalesce()', function () {
        it('should return "value"', function () {
            assert.equal(Util.nullCoalesce('value', 'default'), 'value');
        });

        it('should return "default"', function () {
            assert.equal(Util.nullCoalesce(undefined, 'default'), 'default');
        });

        it('should return "default"', function () {
            assert.equal(Util.nullCoalesce(null, 'default'), 'default');
        });
    });

    describe('.falseCoalesce()', function () {
        it('should return "value"', function () {
            assert.equal(Util.falseCoalesce('value', 'default'), 'value');
        });

        it('should return "default"', function () {
            assert.equal(Util.falseCoalesce(false, 'default'), 'default');
        });
    });

    describe('.coalesceString()', function () {
        it('should return "value"', function () {
            assert.equal(Util.coalesceString('value', 'default'), 'value');
        });

        it('should return "default"', function () {
            assert.equal(Util.coalesceString(null, 'default'), 'default');
        });

        it('should return "default"', function () {
            assert.equal(Util.coalesceString('', 'default'), 'default');
        });
    });

    describe('.coalesceColour()', function () {
        it('should return "#FEFEFE"', function () {
            assert.equal(Util.coalesceColour('#FEFEFE', 'default'), '#FEFEFE');
        });

        it('should return "default"', function () {
            assert.equal(Util.coalesceColour(null, 'default'), 'default');
        });

        it('should return "default"', function () {
            assert.equal(Util.coalesceColour('#feafgr', 'default'), 'default');
        });

        it('should return "default"', function () {
            assert.equal(Util.coalesceColour('ffffff', 'default'), 'default');
        });
    });
});

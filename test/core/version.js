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

const { Version } = require('../../core/version');
const assert = require('chai').assert;

describe('Version', function () {
    describe('.compare()', function () {
        it('should return 0', function () {
            const a = { major: 1, minor: 2, patch: 3 };
            const b = { major: 1, minor: 2, patch: 3 };
            assert.equal(Version.compare(a, b), 0);
        });

        it('should return -1', function () {
            const a = { major: 1, minor: 2, patch: 3 };
            const b = { major: 2, minor: 2, patch: 3 };
            assert.equal(Version.compare(a, b), -1);
        });

        it('should return -1', function () {
            const a = { major: 1, minor: 1, patch: 3 };
            const b = { major: 1, minor: 2, patch: 3 };
            assert.equal(Version.compare(a, b), -1);
        });

        it('should return -1', function () {
            const a = { major: 1, minor: 2, patch: 2 };
            const b = { major: 1, minor: 2, patch: 3 };
            assert.equal(Version.compare(a, b), -1);
        });

        it('should return 1', function () {
            const a = { major: 2, minor: 2, patch: 3 };
            const b = { major: 1, minor: 2, patch: 3 };
            assert.equal(Version.compare(a, b), 1);
        });

        it('should return 1', function () {
            const a = { major: 1, minor: 3, patch: 3 };
            const b = { major: 1, minor: 2, patch: 3 };
            assert.equal(Version.compare(a, b), 1);
        });

        it('should return 1', function () {
            const a = { major: 1, minor: 2, patch: 4 };
            const b = { major: 1, minor: 2, patch: 3 };
            assert.equal(Version.compare(a, b), 1);
        });
    });
});

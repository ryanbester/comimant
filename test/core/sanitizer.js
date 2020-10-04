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

const { Sanitizer } = require('../../core/sanitizer');
const assert = require('chai').assert;

describe('Sanitizer', function () {
    describe('.string()', function () {
        it('should return false', function () {
            assert.isFalse(Sanitizer.string(undefined));
        });

        it('should return false', function () {
            assert.isFalse(Sanitizer.string(null));
        });

        it('should return false', function () {
            assert.isFalse(Sanitizer.string(''));
        });

        it('should return "test"', function () {
            assert.equal(Sanitizer.string('test'), 'test');
        });

        it('should return false', function () {
            assert.isFalse(Sanitizer.string('<p></p>'));
        });

        it('should return "test"', function () {
            assert.equal(Sanitizer.string('<p>test</p>'), 'test');
        });
    });

    describe('.number()', function () {
        it('should return false', function () {
            assert.isFalse(Sanitizer.number(undefined));
        });

        it('should return false', function () {
            assert.isFalse(Sanitizer.number(null));
        });

        it('should return 5', function () {
            assert.equal(Sanitizer.number(5), 5);
        });
    });

    describe('.whitespace()', function () {
        it('should return false', function () {
            assert.isFalse(Sanitizer.whitespace(false));
        });

        it('should return "teststring"', function () {
            assert.equal(Sanitizer.whitespace('test string'), 'teststring');
        });

        it('should return false', function () {
            assert.isFalse(Sanitizer.whitespace(' '));
        });
    });

    describe('.ascii()', function () {
        it('should return false', function () {
            assert.isFalse(Sanitizer.ascii(false));
        });

        it('should return "teststring"', function () {
            assert.equal(Sanitizer.ascii('test😊string'), 'teststring');
        });

        it('should return false', function () {
            assert.isFalse(Sanitizer.ascii('😊'));
        });
    });

    describe('.email()', function () {
        it('should return false', function () {
            assert.isFalse(Sanitizer.email(false));
        });

        it('should return "john.doe@example.com"', function () {
            assert.equal(Sanitizer.email('john.doe@example.com'), 'john.doe@example.com');
        });

        it('should return false', function () {
            assert.isFalse(Sanitizer.email('john.doeexample.com'));
        });

        it('should return false', function () {
            assert.isFalse(Sanitizer.email('john.doe@example'));
        });
    });
});

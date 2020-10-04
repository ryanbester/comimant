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

const { Config } = require('../../core/config');
const assert = require('chai').assert;

describe('Config', function () {
    describe('#getInstance()', function () {
        it('should return an object', function () {
            assert.isObject(Config.getInstance())
            assert.isNotEmpty(Config.getInstance());
        });
    });

    describe('#loadConfig()', function () {
        it('should return true', function () {
            process.env.CONFIG_FILE = "config.json";
            assert.isTrue(Config.getInstance().loadConfig());
            delete process.env.CONFIG_FILE;
        });

        it('should return false', function () {
            process.env.CONFIG_FILE = "/config.json";
            assert.isFalse(Config.getInstance().loadConfig());
            delete process.env.CONFIG_FILE;
        });

        it('should return true', function () {
            assert.isTrue(Config.getInstance().loadConfig());
        });
    });

    describe('#getOption()', function() {
        it('should return true', function() {
            assert.isTrue(Config.getInstance().getOption('debug_mode'));
        });

        it('should return null', function() {
            assert.isNull(Config.getInstance().getOption('non_existent_option'));
        });

        it('should return "value"', function() {
            assert.equal(Config.getInstance().getOption("non_existent_option", "value"), "value");
        });

        it('should return an array of length 1', function() {
            const option = Config.getInstance().getOption('domains');
            assert.isArray(option);
            assert.lengthOf(option, 1);
        });
    })
});

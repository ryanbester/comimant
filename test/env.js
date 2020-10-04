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

const path = require('path');

global.__approot = path.resolve(__dirname);

process.env.NODE_ENV = 'test';
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = 3306;
process.env.DB_DATABASE = 'comimant_test';
process.env.DB_USER = 'comimant_user';
process.env.DB_PASS = 'comimant_pass';
process.env.DB_USER_MODIFY = 'comimant_user_modify';
process.env.DB_PASS_MODIFY = 'comimant_pass_modify';
process.env.DB_USER_DELETE = 'comimant_user_delete';
process.env.DB_PASS_DELETE = 'comimant_pass_delete';
process.env.REDIS_HOST = '127.0.0.1';
process.env.REDIS_PORT = '6379';
process.env.PEPPER = 'UuhKgzaj';
process.env.SECRET_1 = 'E837E9CDA047CDECB55F3805FF2DDDA2F3D74E1E1AB0E269F4E65C6ED17AC191';
process.env.SECRET_2 = 'D4AAA10F478D764389045D863B2DF7DD2A889756C2B8B720D004C6E935F5FBF5';
process.env.COOKIE_SECRET = '22001A3B84AC7D95BE6A1EE5BE7036DA267CA8EE8EBF358A6C7ED1AC0AAB4BDF';
process.env.DATABASE_KEY = 'FF4E60F56AAC7B3986EE8E322FC13F77';

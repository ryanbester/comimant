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

/**
 * Class containing various helper methods for managing versions.
 * @type {Version}
 */
module.exports.Version = class Version {

    /**
     * Compares two versions.
     * @param a The first version.
     * @param b The second version.
     * @returns {number} 0 if the versions are equal, -1 if the first version is less than the second version, or 1 if
     *     the first version is more than the second version.
     */
    static compare(a, b) {
        if (a.major < b.major) {
            return -1;
        }

        if (a.major > b.major) {
            return 1;
        }

        if (a.major === b.major) {
            if (a.minor < b.minor) {
                return -1;
            }

            if (a.minor > b.minor) {
                return 1;
            }

            if (a.minor === b.minor) {
                if (a.patch < b.patch) {
                    return -1;
                }

                if (a.patch > b.patch) {
                    return 1;
                }

                if (a.patch === b.patch) {
                    return 0;
                }
            }
        }
    }

};

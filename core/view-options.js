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

const querystring = require('querystring');

const { Util } = require('../core/util');
const { Sanitizer } = require('../core/sanitizer');

/**
 * Class containing various helper methods for processing view options.
 * @type {ViewOptions}
 */
module.exports.ViewOptions = class ViewOptions {

    /**
     * Processes the query parameters.
     * @param {Object} viewOptions The view options object.
     * @param {String} fullPath The full path of the current page, including the query parameters.
     * @param {Object} queryParams Object of query parameters.
     * @param {Number} defaultPerPage Default items per page.
     * @param {Number} itemsCount Total items count.
     */
    static processQueryParams(viewOptions, fullPath, queryParams, defaultPerPage, itemsCount) {
        // Calculate pagination
        const { per_page, page } = queryParams;
        const perPage = Util.nullCoalesce(Util.falseCoalesce(Sanitizer.number(per_page), undefined), defaultPerPage);
        const currentPage = Number.parseInt(
            Util.nullCoalesce(Util.falseCoalesce(Sanitizer.number(page), undefined), 1));
        const offset = perPage * (currentPage - 1);
        const pages = Math.ceil(itemsCount / perPage);

        viewOptions.page = currentPage;
        viewOptions.perPage = perPage;
        viewOptions.pages = pages;
        viewOptions.offset = offset;

        // Calculate URL for next and previous page buttons
        queryParams.page = (currentPage === 1) ? 1 : currentPage - 1;
        viewOptions.prevPageUrl = fullPath + '?' + querystring.stringify(queryParams);
        queryParams.page = (currentPage === pages) ? pages : currentPage + 1;
        viewOptions.nextPageUrl = fullPath + '?' + querystring.stringify(queryParams);

        // Get sort parameters
        const { sort_column, sort_mode } = queryParams;
        viewOptions.sortColumn = Util.falseCoalesce(Sanitizer.string(sort_column), undefined);
        viewOptions.sortMode = Util.falseCoalesce(Sanitizer.string(sort_mode), undefined);

        // Get visible columns
        for (const [name, column] of Object.entries(viewOptions.columns)) {
            // Change visibility of default columns
            if (column.visible) {
                if (queryParams[name] === 'off') {
                    column.visible = false;
                }
            }

            if (queryParams[name] === 'on') {
                column.visible = true;
            }
        }

        // Get filter parameters
        const { filter_column, filter_mode, filter_term } = queryParams;
        viewOptions.filterColumn = Util.falseCoalesce(Sanitizer.string(filter_column), undefined);
        viewOptions.filterMode = Util.falseCoalesce(Sanitizer.string(filter_mode), undefined);
        viewOptions.filterTerm = Util.falseCoalesce(Sanitizer.string(filter_term), undefined);
    }

};

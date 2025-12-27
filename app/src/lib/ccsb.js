/*
 * Copyright (C) 2019 Shane F. Carr
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

"use strict";

const CardCreatr = require("card-creatr");
const url = require("url");

const ccsb = new (CardCreatr.CcsbReader)(url.parse(window.location.href, { parseQueryString: true }).query.path || null);

const oldWriteFile = ccsb.writeFile;
const oldCreateFile = ccsb.createFile;
const oldRemoveFile = ccsb.removeFile;

ccsb.writeFile = function() {
	let ret = oldWriteFile.apply(ccsb, arguments);
	require("../store").commit("updateAllAssets");
	return ret;
};

ccsb.createFile = function() {
	let ret = oldCreateFile.apply(ccsb, arguments);
	require("../store").commit("updateAllAssets");
	return ret;
};

ccsb.removeFile = function() {
	let ret = oldRemoveFile.apply(ccsb, arguments);
	require("../store").commit("updateAllAssets");
	return ret;
};

module.exports = ccsb;

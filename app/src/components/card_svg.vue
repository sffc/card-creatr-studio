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

var template = `
<svg class="card-svg" :viewBox="viewBox" width="1" height="1" v-html="outerSvg"></svg>
`;

//<script>
const Utils = require("../lib/utils");
const store = require("../store");

module.exports = {
	template: template,
	props: ["dims", "content"],
	computed: {
		viewBox: function() {
			return "0 0 " + this.aspectRatio + " 1";
		},
		dims: function() {
			let options = store.getters.globalOptions;
			if (!options) return null;
			return options.get("/dimensions/card");
		},
		aspectRatio: function() {
			return this.dims ? this.dims.width / this.dims.height : 1;
		},
		outerSvg: function() {
			return Utils.finalizeSvg(this.content, this.dims, store.getters.globalOptions, true, 1, 1);
		}
	}
};
//</script>

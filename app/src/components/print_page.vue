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
<div :style="{ top: withUnits.top }" v-html="outerSvg"></div>
`;

//<script>
const Vue = require("vue/dist/vue");
const Utils = require("../lib/utils");
const store = require("../store");

Vue.component("print-page", {
	template: template,
	props: ["svgString", "dims", "pageIndex"],
	computed: {
		withUnits: function() {
			return {
				width: this.dims.width + this.dims.unit,
				height: this.dims.height + this.dims.unit,
				top: (this.pageIndex * this.dims.height) + this.dims.unit
			};
		},
		viewBox: function() {
			return "0 0 " + this.aspectRatio + " 1";
		},
		dims: function() {
			let options = store.getters.globalOptions;
			if (!options) return null;
			return options.get("/dimensions/page");
		},
		aspectRatio: function() {
			return this.dims ? this.dims.width / this.dims.height : 1;
		},
		outerSvg: function() {
			return Utils.finalizeSvg(this.svgString, this.dims, store.getters.globalOptions, false, 1, 1);
		}
	}
});
//</script>

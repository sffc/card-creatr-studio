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
<div class="asset-box">
	<em>{{ path }}</em><br/>
	<span>{{ fileSizeString }}</span>
	<button v-on:click="deleteFile">\u232B Delete</button>
</div>
`;

//<script>
const ccsb = require("../lib/ccsb");
const store = require("../store");
const Utils = require("../lib/utils");

module.exports = {
	template: template,
	props: ["path"],
	emits: ["remove"],
	computed: {
		fileSizeString: function() {
			return Utils.fileSizeString(this.bytes);
		},
		buffer: function() {
			return store.getters.buffer(this.path);
		},
		bytes: function() {
			if (!this.buffer) return 0;
			return this.buffer.length;
		}
	},
	methods: {
		deleteFile: function() {
			if (confirm("Delete this asset?\n" + this.path)) {
				ccsb.removeFile(this.path);
				this.$emit("remove", this.path);
			}
		}
	}
};
//</script>

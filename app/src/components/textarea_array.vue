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
<textarea v-model="lines" v-on:click="onClick"></textarea>
`;

//<script>
module.exports = {
	template: template,
	props: ["value"],
	computed: {
		lines: {
			get: function() {
				if (!this.value) {
					return "";
				} else if (typeof this.value === "string") {
					// normal case
					return this.value;
				} else {
					// special case: when an array of strings is provided
					return this.value.join("\n");
				}
			},
			set: function(newLines) {
				this.$emit("input", newLines);
			}
		}
	},
	methods: {
		onClick: function(event) {
			this.$emit("click", event);
		}
	}
};
//</script>

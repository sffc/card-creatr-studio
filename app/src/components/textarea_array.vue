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
	props: ["modelValue"],
	emits: ["update:modelValue"],
	computed: {
		lines: {
			get: function() {
				if (!this.modelValue) {
					return "";
				} else if (typeof this.modelValue === "string") {
					// normal case
					return this.modelValue;
				} else {
					// special case: when an array of strings is provided
					return this.modelValue.join("\n");
				}
			},
			set: function(newLines) {
				this.$emit("update:modelValue", newLines);
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

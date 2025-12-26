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
<select v-model="selected">
  <option v-for="option in options" v-bind:value="option.value">
    {{ option.text }}
  </option>
</select>
`;

//<script>
module.exports = {
	template: template,
	props: ["modelValue", "dropdownV1"],
	emits: ["update:modelValue"],
	computed: {
		selected: {
			get: function() {
				return this.modelValue || "";
			},
			set: function(option) {
				this.$emit("update:modelValue", option);
			}
		},
		options: function() {
			return [{ value: "", text: "<empty>" }].concat(this.dropdownV1.split("\n").map((line) => { return { value: line, text: line }; }));
		}
	},
	methods: {
		onClick: function(event) {
			this.$emit("click", event);
		}
	}
};
//</script>

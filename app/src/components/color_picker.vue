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

let template = `
<div class="color-picker">
	<div class="color-picker-preview" v-on:click="openPopout1" v-bind:style="previewStyle"></div>
	<div class="color-picker-expanded" v-on:click="openPopout2">···</div>
	<div class="color-picker-popout" v-if="open1" v-on:click="preventClose">
		<swatches v-model="colors"></swatches>
	</div>
	<div class="color-picker-popout" v-if="open2" v-on:click="preventClose">
		<sliders v-model="colors"></sliders>
	</div>
</div>
`;

//<script>
const VueColor = require("vue-color");

const REGEX_RGBA = /^rgba?\s*\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)$/;

module.exports = {
	template,
	props: ["modelValue"],
	emits: ["update:modelValue"],
	data() {
		return {
			open1: false,
			open2: false,
			closeTimeout: null
		};
	},
	created() {
		window.addEventListener("click", () => {
			this.closeTimeout = setTimeout(() => {
				this.open1 = false;
				this.open2 = false;
			}, 0);
		}, true);
	},
	computed: {
		colors: {
			get() {
				let value = "" + this.modelValue;
				let match;
				// Allow the input to be in hex syntax or rgba syntax
				if (value[0] === "#") {
					return value;
				} else if (match = REGEX_RGBA.exec(value)) {  // eslint-disable-line no-cond-assign
					return {
						r: parseInt(match[1]),
						g: parseInt(match[2]),
						b: parseInt(match[3]),
						a: (typeof match[4] !== "undefined") ? parseFloat(match[4]) : 1
					};
				} else {
					return {};
				}
			},
			set(newValue) {
				if (newValue.a) {
					// alpha channel: use rgba syntax
					this.$emit("update:modelValue", "rgba("+newValue.r+","+newValue.g+","+newValue.b+","+newValue.a+")");
				} else {
					// no alpha channel: use hex syntax
					this.$emit("update:modelValue", newValue);
				}
			},
		},
		previewStyle() {
			return {
				backgroundColor: this.modelValue
			};
		}
	},
	methods: {
		openPopout1() {
			this.open1 = true;
			this.open2 = false;
			this.preventClose();
		},
		openPopout2() {
			this.open1 = false;
			this.open2 = true;
			this.preventClose();
		},
		preventClose() {
			clearTimeout(this.closeTimeout);
		}
	},
	components: {
		swatches: VueColor.SwatchesPicker,
		sliders: VueColor.ChromePicker
	}
};
//</script>

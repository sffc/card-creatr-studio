"use strict";

var template = `
<div class="color-picker">
	<div class="color-picker-preview" v-on:click="openPopout1" v-bind:style="previewStyle"></div>
	<div class="color-picker-expanded" v-on:click="openPopout2">···</div>
	<div class="color-picker-popout" v-if="open1" v-on:click="preventClose">
		<swatches v-model="colors" @change-color="onChange"></swatches>
	</div>
	<div class="color-picker-popout" v-if="open2" v-on:click="preventClose">
		<sliders v-model="colors" @change-color="onChange"></sliders>
	</div>
</div>
`;

//<script>
const Vue = require("vue/dist/vue");
const VueColor = require("vue-color/dist/vue-color");

const REGEX_RGBA = /^rgba?\s*\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d\.]+))?\s*\)$/;

Vue.component("color-picker", {
	template: template,
	props: ["value"],
	data: function() {
		return {
			open1: false,
			open2: false,
			closeTimeout: null
		};
	},
	created: function() {
		window.addEventListener("click", () => {
			this.closeTimeout = setTimeout(() => {
				this.open1 = false;
				this.open2 = false;
			}, 0);
		}, true);
	},
	computed: {
		colors: function() {
			let value = "" + this.value;
			let match;
			// Allow the input to be in hex syntax or rgba syntax
			if (value[0] === "#") {
				return {
					hex: value
				};
			} else if (match = REGEX_RGBA.exec(value)) {
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
		previewStyle: function() {
			return {
				backgroundColor: this.value
			};
		}
	},
	methods: {
		onChange: function(colors) {
			if (colors.rgba.a < 1) {
				// alpha channel: use rgba syntax
				this.$emit("input", "rgba("+colors.rgba.r+","+colors.rgba.g+","+colors.rgba.b+","+colors.rgba.a+")");
			} else {
				// no alpha channel: use hex syntax
				this.$emit("input", colors.hex);
			}
		},
		openPopout1: function() {
			this.open1 = true;
			this.open2 = false;
			this.preventClose();
		},
		openPopout2: function() {
			this.open1 = false;
			this.open2 = true;
			this.preventClose();
		},
		preventClose: function() {
			clearTimeout(this.closeTimeout);
		}
	},
	components: {
		swatches: VueColor.Swatches,
		sliders: VueColor.Chrome
	}
});
//</script>

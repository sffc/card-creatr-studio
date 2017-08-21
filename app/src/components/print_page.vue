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

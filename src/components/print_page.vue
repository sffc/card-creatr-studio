"use strict";

var template = `
<svg :width="withUnits.width" :height="withUnits.height" viewBox="0 0 1 1" :style="{ top: withUnits.top }" preserveAspectRatio="none" v-html="svgString"></svg>
`;

//<script>
const Vue = require("vue/dist/vue");

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
		}
	}
});
//</script>

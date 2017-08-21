"use strict";

var template = `
<svg class="card-svg" :viewBox="viewBox" width="1" height="1" v-html="outerSvg"></svg>
`;

//<script>
const Vue = require("vue/dist/vue");
const Utils = require("../lib/utils");
const store = require("../store");

Vue.component("card-svg", {
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
});
//</script>

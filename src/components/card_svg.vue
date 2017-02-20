"use strict";

var template = `
<svg class="card-svg" :viewBox="viewBox" width="1" height="1" v-html="outerSvg"></svg>
`;

//<script>
const Vue = require("vue/dist/vue");
const CardCreatr = require("card-creatr");
const store = require("../store");

Vue.component("card-svg", {
	template: template,
	props: ["aspectRatio", "content"],
	computed: {
		viewBox: function() {
			return "0 0 " + this.aspectRatio + " 1";
		},
		outerSvg: function() {
			if (!this.content) return null;
			var globalOptions = store.getters.globalOptions;
			if (!globalOptions) return null;
			var svgHolder = new (CardCreatr.SvgHolder)(this.aspectRatio, 1, "0 0 1 1");
			svgHolder.fonts = globalOptions.get("/fonts");
			svgHolder.writeFontFaceCSS = (globalOptions.get("/fontRenderMode") === "auto");
			svgHolder.content = this.content;
			return svgHolder.finalizeToBuffer().toString("utf-8");
		}
	}
});
//</script>

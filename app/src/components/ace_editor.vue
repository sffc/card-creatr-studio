"use strict";

var template = `
<div></div>
`;

//<script>
const Vue = require("vue/dist/vue");
const path = require("path");

// Ace uses the old-school mechanism where it adds itself to the global object upon require.
require("ace-builds/src-noconflict/ace");
require("ace-builds/src-noconflict/mode-jade");
require("ace-builds/src-noconflict/theme-solarized_light");
require("../vendor/mode-hjson.js");
window.ace.config.set("basePath", path.join(__dirname, "node_modules/ace-builds/src-noconflict"));

Vue.component("ace-editor", {
	template: template,
	props: ["mode", "theme", "value"],
	mounted: function() {
		this._editor = window.ace.edit(this.$el);
		this._editor.getSession().setMode("ace/mode/" + this.mode);
		this._editor.setTheme("ace/theme/" + this.theme);
		this._editor.getSession().setUseWrapMode(true);
		this._editor.getSession().setTabSize(2);
		this._editor.getSession().setUseSoftTabs(false);
		this._editor.setHighlightActiveLine(false);
		this._editor.setShowPrintMargin(false);
		this._editor.renderer.setOption("showLineNumbers", false);
		this._editor.$blockScrolling = Infinity;
		this._editor.setValue(this.value || "");
		this._editor.gotoLine(0);
		this._editor.on("change", () => {
			if (!this._editor._silent) {
				this.$emit("input", this._editor.getValue());
			}
		});
	},
	watch: {
		mode: function(mode) {
			this._editor.getSession().setMode("ace/mode/" + mode);
		},
		theme: function(theme) {
			this._editor.setTheme("ace/theme/" + theme);
		},
		value: function(value) {
			if (value !== this._editor.getValue()) {
				this._editor._silent = true;
				this._editor.setValue(value);
				this._editor._silent = false;
				this._editor.gotoLine(0);
			}
		},
	}
});
//</script>

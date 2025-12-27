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
<div></div>
`;

//<script>
const path = require("path");

// Ace uses the old-school mechanism where it adds itself to the global object upon require.
require("ace-builds/src-noconflict/ace");
require("ace-builds/src-noconflict/mode-jade");
require("ace-builds/src-noconflict/theme-solarized_light");
require("../vendor/mode-hjson.js");
window.ace.config.set("basePath", path.join(__dirname, "node_modules/ace-builds/src-noconflict"));

module.exports = {
	template,
	props: ["mode", "theme", "modelValue"],
	emits: ["update:modelValue"],
	mounted() {
		this._editor = window.ace.edit(this.$el);
		this._editor.getSession().setMode("ace/mode/" + this.mode);
		this._editor.setTheme("ace/theme/" + this.theme);
		this._editor.getSession().setUseWrapMode(true);
		this._editor.getSession().setTabSize(2);
		this._editor.getSession().setUseSoftTabs(false);
		this._editor.setHighlightActiveLine(false);
		this._editor.setShowPrintMargin(false);
		// this._editor.setOption("showLineNumbers", false);
		this._editor.$blockScrolling = Infinity;
		this._editor.setValue(this.modelValue || "");
		this._editor.gotoLine(0);
		this._editor.on("change", () => {
			if (!this._editor._silent) {
				this.$emit("update:modelValue", this._editor.getValue());
			}
		});
	},
	watch: {
		mode(mode) {
			this._editor.getSession().setMode("ace/mode/" + mode);
		},
		theme(theme) {
			this._editor.setTheme("ace/theme/" + theme);
		},
		modelValue(value) {
			if (value !== this._editor.getValue()) {
				this._editor._silent = true;
				this._editor.setValue(value);
				this._editor._silent = false;
				this._editor.gotoLine(0);
			}
		},
	}
};
//</script>

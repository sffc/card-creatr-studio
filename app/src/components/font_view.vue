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
<div class="font-view">
	<div class="font-box" v-for="info of defaults">
		<div class="font-title">{{ info.name }}</div>
		<div class="font-demo" v-html="fontDemo(info)"></div>
	</div>
	<div class="font-box" v-for="info of fonts">
		<div class="font-title">
			<input v-model="info.name" />
			<small>({{ info.sourceName }} {{ info.sourceVariant }})</small>
		</div>
		<div class="font-demo" v-html="fontDemo(info)"></div>
		<button v-on:click="removeFont(info)">\u232B Remove Font</button>
	</div>
	<div class="font-box">
		<div class="font-title">Add New Font</div>
		<small>Preview available fonts at <a href="https://fonts.google.com/" target="_blank">fonts.google.com</a></small><br/>
		<select v-model="currentName">
			<option v-for="name in allFontNames" v-bind:value="name">{{ name }}</option>
		</select>
		<template v-if="currentName">
			<br/>
			<select v-model="currentVariant">
				<option v-for="variant in allVariants" v-bind:value="variant">{{ variant }}</option>
			</select>
		</template>
		<template v-if="currentVariant">
			<br/>
			<button v-on:click="addFont">Add Font</button>
		</template>
	</div>
</div>
`;

//<script>
const google_fonts = require("../lib/google_fonts");
const store = require("../store");
const ccsb = require("../lib/ccsb");
const mime = require("mime");

module.exports = {
	template: template,
	props: ["fonts"],
	data: function() {
		return {
			allFontNames: [],
			currentName: null,
			allVariants: [],
			currentVariant: null
		};
	},
	created: function() {
		google_fonts.getNameList((list) => {
			list.sort();
			this.allFontNames = list;
		});
	},
	computed: {
		defaults: function() {
			let options = store.getters.globalOptions;
			if (!options) return [];
			return [
				{
					name: "title",
					filename: options.get("/fonts").title.path,
					dataUri: options.get("/fonts").title.dataUri
				},
				{
					name: "body",
					filename: options.get("/fonts").body.path,
					dataUri: options.get("/fonts").body.dataUri
				}
			];
		}
	},
	methods: {
		dataUri: function(filename) {
			let buffer = store.getters.buffer(filename);
			if (!buffer) return "about:null";
			return `data:${ mime.lookup(filename) };base64,${ buffer.toString("base64") }`;
		},
		fontDemo: function(info) {
			return `
			<style type="text/css" scoped>
				@font-face {
					font-family: "${info.name}";
					src: url("` + (info.dataUri ? info.dataUri : this.dataUri(info.filename)) + `");
				}
			</style>
			<span style="font-family: ${info.name};">The quick brown fox jumps over the lazy dog.</span>
			`;
		},
		addFont: function() {
			google_fonts.getBuffer(this.currentName, this.currentVariant, (err, mimeType, buffer) => {
				let filePath = ccsb.createFile(mimeType, "fonts", buffer);
				store.commit("addFont", {
					name: this.currentName.toLowerCase().replace(/\W/, ""),
					filename: filePath,
					source: "google",
					sourceName: this.currentName,
					sourceVariant: this.currentVariant
				});
			});
		},
		removeFont: function(fontInfo) {
			if (confirm(`Are you sure you want to remove the font "${fontInfo.name}" (${fontInfo.sourceName} ${fontInfo.sourceVariant}) from this ccsb file?`)) {
				store.commit("removeFont", fontInfo);
				ccsb.removeFile(fontInfo.filename); // TODO: put in try/catch
			}
		}
	},
	watch: {
		currentName: function() {
			this.currentVariant = null;
			google_fonts.getVariants(this.currentName, (err, variants) => {
				this.allVariants = variants;
			});
		}
	}
};
//</script>

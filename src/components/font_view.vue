"use strict";

var template = `
<div class="font-view">
	<div class="font-box" v-for="info of fonts">
		<strong>{{ info.name }} ({{ info.sourceName }} {{ info.sourceVariant }})</strong>
		<div class="font-demo" v-html="fontDemo(info)"></div>
		<label class="font-nickname">Nickname: <input v-model="info.name" /></label>
	</div>
	<div class="font-box">
		<strong>Add New Font</strong>
		<select v-model="currentName">
			<option v-for="name in allFontNames" v-bind:value="name">{{ name }}</option>
		</select>
		<template v-if="currentName">
			<select v-model="currentVariant">
				<option v-for="variant in allVariants" v-bind:value="variant">{{ variant }}</option>
			</select>
		</template>
		<template v-if="currentVariant">
			<button v-on:click="addFont">Add Font</button>
		</template>
	</div>
</div>
`;

//<script>
const Vue = require("vue/dist/vue");
const google_fonts = require("../lib/google_fonts");
const store = require("../store");
const ccsb = require("../lib/ccsb");
const mime = require("mime");

Vue.component("font-view", {
	template: template,
	props: ["fonts"],
	data: function() {
		return {
			allFontNames: [],
			currentName: null,
			allVariants: [],
			currentVariant: null
		}
	},
	created: function() {
		google_fonts.getNameList((list) => {
			list.sort();
			this.allFontNames = list;
		});
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
					src: url("` + this.dataUri(info.filename) + `");
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
		}
	},
	watch: {
		currentName: function() {
			google_fonts.getVariants(this.currentName, (err, variants) => {
				this.allVariants = variants;
			});
		}
	}
});
//</script>

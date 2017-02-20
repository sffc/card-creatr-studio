"use strict";

var template = `
<div class="image-chooser">
	<template v-if="hasImage && !isCorrupted">
		<span>
			<img :src="dataUri" :alt="placeholder" class="thumbnail" />
		</span>
		<span>
			{{ fileSizeString }}
		</span>
		<span>
			<button v-on:click.stop="clearImage" class="clearImage" title="Remove Image">\u232B</button>
		</span>
	</template>
	<template v-else>
		<template v-if="isCorrupted">
			<span>error with image</span>
		</template>
		<template v-else>
			<span>
				<input type="file" v-on:click.stop v-on:change="onFileChoosen" />
			</span>
		</template>
	</template>
</div>
`;

//<script>
const Vue = require("vue/dist/vue");
const Utils = require("../lib/utils");
const ccsb = require("../lib/ccsb");
const fs = require("fs");
const mime = require("mime");

Vue.component("image-chooser", {
	template: template,
	props: ["value", "placeholder", "error", "extra"],
	computed: {
		hasImage: function() {
			return !!this.value;
		},
		isCorrupted: function() {
			if (!this.extra) return false;
			if (!this.extra.buffer || !this.extra.dataUri) return true;
			return false;
		},
		dataUri: function() {
			if (!this.extra) return null;
			return this.extra.dataUri;
		},
		fileSizeString: function() {
			if (!this.extra) return null;
			let bytes = this.extra.buffer.length;
			return Utils.fileSizeString(bytes);
		}
	},
	methods: {
		clearImage: function() {
			if (confirm("Remove this image?")) {
				ccsb.removeFile(this.value);
				this.$emit("input", null);
			}
		},
		onFileChoosen: function(event) {
			let file = event.target.files[0];
			if (!file) return;
			fs.readFile(file.path, (err, buffer) => {
				if (err) return alert(err);
				let filePath = ccsb.createFile(mime.lookup(file.path), "card_assets", buffer);
				this.$emit("input", filePath);
			});
		}
	}
});
//</script>

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
const Utils = require("../lib/utils");
const ccsb = require("../lib/ccsb");
const mime = require("mime");

module.exports = {
	template,
	props: ["modelValue", "placeholder", "extra"],
	emits: ["update:modelValue"],
	computed: {
		hasImage() {
			return !!this.modelValue;
		},
		isCorrupted() {
			if (!this.extra) return false;
			if (!this.extra.buffer || !this.extra.dataUri) return true;
			return false;
		},
		dataUri() {
			if (!this.extra) return null;
			return this.extra.dataUri;
		},
		fileSizeString() {
			if (!this.extra) return null;
			let bytes = this.extra.buffer.length;
			return Utils.fileSizeString(bytes);
		}
	},
	methods: {
		clearImage() {
			if (confirm("Remove this image?")) {
				let filePath = this.modelValue;
				this.$emit("update:modelValue", null);
				this.$store.commit("tryRemoveCardAsset", filePath);
			}
		},
		onFileChoosen(event) {
			let file = event.target.files[0];
			if (!file) return;
			const reader = new FileReader();
			reader.addEventListener("load", (event) => { // eslint-disable-line no-shadow
				console.log("Loaded file:", reader.result?.byteLength, event);
				let filePath = ccsb.createFile(mime.lookup(file.name), "card_assets", reader.result);
				this.$emit("update:modelValue", filePath);
			});
			reader.addEventListener("error", (event) => { // eslint-disable-line no-shadow
				alert(event);
			});
			reader.readAsArrayBuffer(file);
		}
	}
};
//</script>

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
const fs = require("fs");
const mime = require("mime");

module.exports = {
	template: template,
	props: ["modelValue", "placeholder", "extra"],
	emits: ["update:modelValue"],
	computed: {
		hasImage: function() {
			return !!this.modelValue;
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
				ccsb.removeFile(this.modelValue);
				this.$emit("update:modelValue", null);
			}
		},
		onFileChoosen: function(event) {
			let file = event.target.files[0];
			if (!file) return;
			fs.readFile(file.path, (err, buffer) => {
				if (err) return alert(err);
				let filePath = ccsb.createFile(mime.lookup(file.path), "card_assets", buffer);
				this.$emit("update:modelValue", filePath);
			});
		}
	}
};
//</script>

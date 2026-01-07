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
<div class="asset-box">
	<strong>Add File</strong><br/>
	<input type="file" v-on:click.stop v-on:change="uploadFile" />
</div>
`;

//<script>
const ccsb = require("../lib/ccsb");
const fs = require("fs");
const path = require("path");

module.exports = {
	template,
	props: [],
	emits: ["upload"],
	methods: {
		uploadFile(event) {
			let file = event.target.files[0];
			if (!file) return;
			const reader = new FileReader();
			reader.addEventListener("load", (event) => { // eslint-disable-line no-shadow
				console.log("Loaded file:", reader.result?.byteLength, event);
				let basename = path.basename(file.name);
				// no path.join() here because we are in the zip file, which always uses '/'
				while (ccsb.containsFile("assets/" + basename)) {
					basename = "_" + basename;
				}
				ccsb.writeFile("assets/" + basename, reader.result);
				this.$emit("upload");
			});
			event.target.value = null;
			reader.addEventListener("error", (event) => { // eslint-disable-line no-shadow
				alert(event);
			});
			reader.readAsArrayBuffer(file);
		}
	}
};
//</script>

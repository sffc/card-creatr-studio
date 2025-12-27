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
<div>
	<div class="error-entry" v-for="[key,err] in errorsArray">{{ err.toString() }} ({{ key }})\n<span class="error-details" v-on:click="showDetails(key, err)">(technical details)</span></div>
</div>
`;

//<script>
const electron = require("electron");

module.exports = {
	template,
	props: ["show"],
	computed: {
		errorsArray() {
			let result = [];
			for (let [key, err] of this.show) {
				result.push([key, err]);
			}
			return result;
		},
	},
	methods: {
		showDetails(key, err) {
			electron.ipcRenderer.send("showMessageBox", {
				type: "error",
				title: `Error Details: ${key}`,
				message: err.message,
				detail: err.stack,
				buttons: ["OK"],
				defaultId: 0
			});
		}
	}
};
//</script>

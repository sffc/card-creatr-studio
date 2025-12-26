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
<tr v-bind:class="{ active: active }">
	<td class="left-buffer"></td>
	<td v-for="field in fields">
		<template v-if="field.display == 'string'">
			<input v-model="card[field.id]" v-on:click.stop :placeholder="field.name"/>
		</template>
		<template v-if="field.display == 'number'">
			<template v-if="field.properties.indexOf('uint') !== -1">
				<input v-model="card[field.id]" v-on:click.stop :placeholder="field.name" type="number" min="0"/>
			</template>
			<template v-else>
				<input v-model="card[field.id]" v-on:click.stop :placeholder="field.name" type="number"/>
			</template>
		</template>
		<template v-if="field.display == 'multiline'">
			<textarea-array v-model="card[field.id]" v-on:click.stop></textarea-array>
		</template>
		<template v-if="field.display == 'image'">
			<image-chooser v-model="card[field.id]" :placeholder="field.name" :extra="optionsFor(field)"></image-chooser>
		</template>
		<template v-if="field.display == 'color'">
			<color-picker v-model="card[field.id]"></color-picker>
		</template>
		<template v-if="field.display == 'dropdown'">
			<dropdown-field v-model="card[field.id]" :dropdownV1="field.dropdownV1"></dropdown-field>
		</template>
	</td>
</tr>
`;

//<script>
module.exports = {
	template: template,
	components: {
		"image-chooser": require("./image_chooser"),
		"color-picker": require("./color_picker"),
		"textarea-array": require("./textarea_array"),
		"dropdown-field": require("./dropdown_field"),
	},
	props: ["card", "fields", "active"],
	computed: {
	},
	methods: {
		optionsFor: function(field) {
			let cardOptions = this.$store.state.cardOptions[this.card.id];
			if (!cardOptions) return null;
			return cardOptions.get("/" + field.name);
		}
	}
};
//</script>

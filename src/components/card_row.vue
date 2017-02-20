"use strict";

var template = `
<tr v-on:click="onClick" v-bind:class="{ active: active }">
	<td class="left-buffer"></td>
	<td v-for="field in fields">
		<template v-if="field.display == 'string'">
			<template v-if="field.array">
				<textarea-array v-model="card[field.id]" v-on:click.stop></textarea-array>
			</template>
			<template v-else>
				<input v-model="card[field.id]" v-on:click.stop :placeholder="field.name"/>
			</template>
		</template>
		<template v-if="field.display == 'image'">
			<image-chooser v-model="card[field.id]" :placeholder="field.name" :extra="optionsFor(field)"></image-chooser>
		</template>
	</td>
</tr>
`;

//<script>
const Vue = require("vue/dist/vue");
require("./image_chooser");
require("./textarea_array");

Vue.component("card-row", {
	template: template,
	props: ["card", "fields", "active"],
	computed: {
	},
	methods: {
		onClick: function(event) {
			this.$emit("click", event);
		},
		optionsFor: function(field) {
			let cardOptions = this.$store.state.cardOptions[this.card.id];
			if (!cardOptions) return null;
			return cardOptions.get("/" + field.name);
		}
	}
});
//</script>

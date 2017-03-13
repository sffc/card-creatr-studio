"use strict";

var template = `
<textarea v-model="lines" v-on:click="onClick"></textarea>
`;

//<script>
const Vue = require("vue/dist/vue");

Vue.component("textarea-array", {
	template: template,
	props: ["value"],
	computed: {
		lines: {
			get: function() {
				if (!this.value) {
					return "";
				} else if (typeof this.value === "string") {
					// normal case
					return this.value;
				} else {
					// special case: when an array of strings is provided
					return this.value.join("\n");
				}
			},
			set: function(newLines) {
				this.$emit("input", newLines);
			}
		}
	},
	methods: {
		onClick: function(event) {
			this.$emit("click", event);
		}
	}
});
//</script>

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
				} else {
					return this.value.join("\n");
				}
			},
			set: function(newLines) {
				this.$emit("input", newLines.split("\n"));
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

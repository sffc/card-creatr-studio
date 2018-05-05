"use strict";

var template = `
<select v-model="selected">
  <option v-for="option in options" v-bind:value="option.value">
    {{ option.text }}
  </option>
</select>
`;

//<script>
const Vue = require("vue/dist/vue");

Vue.component("dropdown-field", {
	template: template,
	props: ["value", "dropdownV1"],
	computed: {
		selected: {
			get: function() {
				return this.value || "";
			},
			set: function(option) {
				this.$emit("input", option);
			}
		},
		options: function() {
			return [{ value: "", text: "<empty>" }].concat(this.dropdownV1.split("\n").map((line) => { return { value: line, text: line } }));
		}
	},
	methods: {
		onClick: function(event) {
			this.$emit("click", event);
		}
	}
});
//</script>

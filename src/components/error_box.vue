"use strict";

var template = `
<div>
	<div class="error-entry" v-for="[key,err] in errorsArray">{{ err.toString() }} ({{ key }})\n<span class="error-details" v-on:click="showDetails(key, err)">(technical details)</span></div>
</div>
`;

//<script>
const Vue = require("vue/dist/vue");
const electron = require("electron");

Vue.component("error-box", {
	template: template,
	props: ["show"],
	computed: {
		errorsArray: function() {
			let result = [];
			for (let [key, err] of this.show) {
				result.push([key, err]);
			}
			return result;
		},
	},
	methods: {
		showDetails: function(key, err) {
			electron.remote.dialog.showMessageBox({
				type: "error",
				title: "Error Details: " + key,
				message: err.message,
				detail: err.stack,
				buttons: ["OK"],
				defaultId: 0
			});
		}
	}
});
//</script>

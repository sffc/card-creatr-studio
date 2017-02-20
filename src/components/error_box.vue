"use strict";

var template = `
<div>
	<div class="error-entry" v-for="err in errorsArray">{{ err.toString() }}\n<span class="error-details" v-on:click="showDetails(err)">(technical details)</span></div>
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
			for (let key of Object.keys(this.show)) {
				let err = this.show[key];
				if (err !== null) {
					result.push(err);
				}
			}
			return result;
		},
	},
	methods: {
		showDetails: function(err) {
			electron.remote.dialog.showMessageBox({
				type: "error",
				title: "Error Details",
				message: err.message,
				detail: err.stack,
				buttons: ["OK"],
				defaultId: 0
			});
		}
	}
});
//</script>

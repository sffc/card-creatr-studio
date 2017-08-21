"use strict";

var template = `
<div class="asset-box">
	<strong>Add File</strong><br/>
	<input type="file" v-on:click.stop v-on:change="uploadFile" />
</div>
`;

//<script>
const Vue = require("vue/dist/vue");
const ccsb = require("../lib/ccsb");
const fs = require("fs");
const path = require("path");

Vue.component("asset-upload-box", {
	template: template,
	props: [],
	methods: {
		uploadFile: function(event) {
			let file = event.target.files[0];
			if (!file) return;
			fs.readFile(file.path, (err, buffer) => {
				if (err) return alert(err);
				let basename = path.basename(file.path);
				// no path.join() here because we are in the zip file, which always uses '/'
				while (ccsb.containsFile("assets/" + basename)) {
					basename = "_" + basename;
				}
				ccsb.writeFile("assets/" + basename, buffer);
				this.$emit("upload");
			});
			event.target.value = null;
		}
	}
});
//</script>

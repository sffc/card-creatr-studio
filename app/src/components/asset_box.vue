"use strict";

var template = `
<div class="asset-box">
	<em>{{ path }}</em><br/>
	<span>{{ fileSizeString }}</span>
	<button v-on:click="deleteFile">\u232B Delete</button>
</div>
`;

//<script>
const ccsb = require("../lib/ccsb");
const store = require("../store");
const Vue = require("vue/dist/vue");
const Utils = require("../lib/utils");

Vue.component("asset-box", {
	template: template,
	props: ["path"],
	computed: {
		fileSizeString: function() {
			return Utils.fileSizeString(this.bytes);
		},
		buffer: function() {
			return store.getters.buffer(this.path);
		},
		bytes: function() {
			if (!this.buffer) return 0;
			return this.buffer.length;
		}
	},
	methods: {
		deleteFile: function() {
			if (confirm("Delete this asset?\n" + this.path)) {
				ccsb.removeFile(this.path);
				this.$emit("remove", this.path);
			}
		}
	}
});
//</script>

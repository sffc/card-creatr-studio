"use strict";

var template = `
<div>
	<div id="f-main">
		<template v-if="cards">
			<div id="f-null" v-on:click="clearCurrentId" v-if="cards">
			</div>
			<div id="f-primary">
				<div id="f-top">
					<div id="f-list" v-on:click="clearCurrentId">
						<div class="card-list-wrapper" v-if="hasCards">
							<card-list-table v-model="currentId" v-on:input="setCurrentId" :cards="cards" :fields="fields" v-on:upload="updateAsset" v-on:remove="removeAsset"></card-list-table>
						</div>
						<div v-else>
							Hello
							<a v-on:click="newCard">Create New Card</a>
						</div>
					</div>
					<div id="f-preview" v-bind:class="{ 'flex-hide': currentId === null }">
						<card-svg :aspect-ratio="aspectRatio" :content="currentSvg"></card-svg>
					</div>
				</div>
	<!--
				<div id="f-bottom">
					<div id="f-tabs">
						<div class="f-tab" v-on:click="gotoTab('template')" v-bind:class="{ active: tab === 'template' }"><span>Template</span></div>
						<div class="f-tab" v-on:click="gotoTab('fields')" v-bind:class="{ active: tab === 'fields' }"><span>Fields</span></div>
						<div class="f-tab" v-on:click="gotoTab('assets')" v-bind:class="{ active: tab === 'assets' }"><span>Assets</span></div>
						<div class="f-tab" v-on:click="gotoTab('advanced')" v-bind:class="{ active: tab === 'advanced' }"><span>Advanced</span></div>
					</div>
					<div id="f-editor" class="ace-container" v-if="tab === 'template'">
						<ace-editor v-model="templateString" mode="jade" theme="solarized_light"></ace-editor>
					</div>
					<div id="f-editor" class="fields-container" v-if="tab === 'fields'">
						<div id="f-fields-left">
							<ul>
								<li v-for="field in fields" v-on:click="setCurrentField" v-bind:class="{ active: currentField === field }">{{ field.name }}</li>
							</ul>
							<button v-on:click="addField">+ Add Field</button>
						</div>
						<div id="f-fields-right">
							<template v-if="currentField">
								<div class="field-box">
									<strong>Name</strong>
									<input v-bind:value="currentField.name" v-on:input="updateFieldName"/>
								</div>
								<div class="field-box">
									<strong>Properties</strong>
									<select v-model="currentField.properties" multiple v-on:change="updateField(currentField)">
										<option>img</option>
										<option>path</option>
										<option>font</option>
									</select>
								</div>
								<div class="field-box">
									<strong>Display</strong>
									<select v-model="currentField.display">
										<option>string</option>
										<option>image</option>
									</select>
								</div>
								<div class="field-box">
									<strong>Width</strong>
									<input type="number" min="0" step="10" v-model="currentField.width"/>
								</div>
								<div class="field-box">
									<strong>Is Array (Multiline Text)</strong>
									<input type="checkbox" v-model="currentField.array" v-on:change="updateField(currentField)"/>
								</div>
								<div class="field-box">
									<strong>Delete Field</strong>
									<button v-on:click="deleteField">Delete Field</button>
								</div>
							</template>
							<template v-else>
								<p>Select a field on the left.</p>
							</template>
						</div>
					</div>
					<div id="f-editor" v-if="tab === 'assets'">
						<div class="assets-container">
							<asset-upload-box v-on:upload="updateAsset"></asset-upload-box>
							<asset-box v-for="path in assets" :path="path" v-on:remove="removeAsset"></asset-box>
						</div>
					</div>
					<div id="f-editor" class="ace-container" v-if="tab === 'advanced'">
						<ace-editor v-model="optionsString" mode="hjson" theme="solarized_light"></ace-editor>
					</div>
				</div>
	-->
			</div>
		</template>
		<template v-else>
			<div id="f-loading">
				<img src="assets/splash.svg" alt="Card Creatr Studio" class="splash" />
			</div>
		</template>
	</div>
	<div id="error-box" v-show="hasErrors">
		<error-box :show="errors"></error-box>
	</div>
	<div id="print" v-if="printing">
		<print-page v-for="(page,pageIndex) in pages" :key="pageIndex" :svg-string="page" :page-index="pageIndex" :dims="pageDimensions"></print-page>
	</div>
</div>
`;

//<script>
const ccsb = require("./lib/ccsb");
require("./components/card_list_table");
require("./components/card_svg");
require("./components/ace_editor");
require("./components/asset_upload_box");
require("./components/asset_box");
require("./components/error_box");
require("./components/print_page");

module.exports = {
	template: template,
	data: () => {
		return {
			tab: "template",
			currentField: null
		};
	},
	computed: {
		cards() {
			return this.$store.state.cardData;
		},
		hasCards() {
			return Object.keys(this.$store.state.cardData).length > 0;
		},
		fields() {
			return this.$store.getters.fields;
		},
		currentId() {
			return this.$store.state.currentId;
		},
		currentSvg() {
			return this.$store.getters.currentSvg;
		},
		aspectRatio() {
			let options = this.$store.getters.globalOptions;
			if (!options) return 1;
			let dims = options.get("/dimensions/card");
			return dims.width / dims.height;
		},
		templateString() {
			return this.$store.state.templateStrng;
		},
		optionsString() {
			return this.$store.state.optionsString;
		},
		assets() {
			this.$store.state.buffers;
			let cards = this.$store.state.cardData;
			let fields = this.$store.getters.fields;
			if (!cards || !fields) return null;
			// Compute all paths that are linked to a card entry and omit them from the assets list.
			let usedPaths = {};
			for (let card of cards) {
				for (let fieldId of Object.keys(card)) {
					let field = fields[fieldId];
					if (field.properties.path) {
						usedPaths[card[fieldId]] = true;
					}
				}
			}
			return ccsb.listAllAssets((path) => {
				return !usedPaths[path];
			});
		},
		errors() {
			return this.$store.getters.errors;
		},
		hasErrors() {
			return this.$store.getters.errors.length > 0;
		},
		printing() {
			return this.$store.state.printing;
		}
	},
	methods: {
		clearCurrentId() {
			this.$store.commit("setCurrentId", null);
		},
		setCurrentId(id) {
			this.$store.commit("setCurrentId", id);
		},
		updateAsset(){/*TODO*/},
		removeAsset(){/*TODO*/},
		newCard(){/*TODO*/},
		gotoTab(newTab) {
			this.tab = newTab;
		},
		setCurrentField(field) {
			this.currentField = field;
		},
		addField(){/*TODO*/},
		updateFieldName(){/*TODO*/},
		updateField(){/*TODO*/},
		deleteField(){/*TODO*/}
	}
};
//</script>

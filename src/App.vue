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
							<card-list-table v-model="currentId" v-on:input="setCurrentId" :cards="cards" :fields="fields"></card-list-table>
						</div>
						<div v-else>
							Hello
							<a v-on:click="newCard">Create New Card</a>
						</div>
					</div>
					<div id="f-preview" v-bind:class="{ 'flex-hide': currentId === null }">
						<card-svg :content="currentSvg"></card-svg>
					</div>
				</div>
				<div id="f-bottom">
					<div id="f-tabs">
						<div class="f-tab" v-on:click="gotoTab('template')" v-bind:class="{ active: tab === 'template' }"><span>Template</span></div>
<!--
						<div class="f-tab" v-on:click="gotoTab('template2')" v-bind:class="{ active: tab === 'template2' }"><span>Template 2</span></div>
-->
						<div class="f-tab" v-on:click="gotoTab('fonts')" v-bind:class="{ active: tab === 'fonts' }"><span>Fonts</span></div>
						<div class="f-tab" v-on:click="gotoTab('fields')" v-bind:class="{ active: tab === 'fields' }"><span>Fields</span></div>
						<div class="f-tab" v-on:click="gotoTab('assets')" v-bind:class="{ active: tab === 'assets' }"><span>Assets</span></div>
						<div class="f-tab" v-on:click="gotoTab('advanced')" v-bind:class="{ active: tab === 'advanced' }"><span>Advanced</span></div>
					</div>
					<div id="f-editor" class="ace-container" v-if="tab === 'template'">
						<ace-editor v-model="templateString" mode="jade" theme="solarized_light"></ace-editor>
					</div>
					<div id="f-editor" class="template2-container" v-if="tab === 'template2'">
						<template-editor v-model="templateString"></template-editor>
					</div>
					<div id="f-editor" class="fonts-container" v-if="tab === 'fonts'">
						<font-view :fonts="fontsList"></font-view>
					</div>
					<div id="f-editor" class="fields-container" v-if="tab === 'fields'">
						<div id="f-fields-left">
							<ul>
								<li v-for="field in fields" v-on:click="setCurrentField(field)" v-bind:class="{ active: currentField === field }">{{ field.name }}</li>
							</ul>
							<button v-on:click="addField">+ Add Field</button>
						</div>
						<div id="f-fields-right">
							<template v-if="currentField">
								<div class="field-box">
									<strong>Name</strong>
									<input v-model="currentField.name"/>
								</div>
								<div class="field-box">
									<strong>Properties</strong>
									<select v-model="currentField.properties" multiple>
										<option>img</option>
										<option>path</option>
										<option>font</option>
									</select>
								</div>
								<div class="field-box">
									<strong>Display</strong>
									<select v-model="currentField.display">
										<option>string</option>
										<option>multiline</option>
										<option>image</option>
										<option>color</option>
									</select>
								</div>
								<div class="field-box">
									<strong>Width</strong>
									<input type="number" min="0" step="10" v-model="currentField.width"/>
								</div>
								<div class="field-box">
									<strong>Other Options</strong>
									<button v-on:click="deleteField">Delete Field</button>
									<button v-on:click="moveFieldUp">Move Up</button>
									<button v-on:click="moveFieldDown">Move Down</button>
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
		<print-page v-for="(page,pageIndex) in pages" :key="pageIndex" :svg-string="page" :page-index="pageIndex"></print-page>
	</div>
</div>
`;

//<script>
const Utils = require("./lib/utils");
require("./components/card_list_table");
require("./components/card_svg");
require("./components/ace_editor");
require("./components/asset_upload_box");
require("./components/asset_box");
require("./components/error_box");
require("./components/print_page");
require("./components/template_editor");
require("./components/font_view");

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
			return this.$store.state.fields;
		},
		fontsList() {
			return this.$store.state.fontsList;
		},
		currentId() {
			return this.$store.state.currentId;
		},
		currentSvg() {
			return this.$store.state.currentSvg;
		},
		templateString: {
			get: function() {
				return this.$store.state.templateString;
			},
			set: function(newValue) {
				this.$store.commit("setTemplateString", newValue);
			}
		},
		optionsString: {
			get: function() {
				return this.$store.state.optionsString;
			},
			set: function(newValue) {
				this.$store.commit("setOptionsString", newValue);
			}
		},
		assets() {
			let cards = this.$store.state.cardData;
			let fields = this.$store.state.fields;
			if (!cards || !fields) return null;
			// Ignore assets linked to a card entry
			let usedPaths = {};
			for (let field of fields) {
				if (field.properties.indexOf("path") !== -1) {
					for (let cardId of Object.keys(cards)) {
						let card = cards[cardId];
						usedPaths[card[field.id]] = true;
					}
				}
			}
			// Ignore assets linked to a font
			for (let fontInfo of this.$store.state.fontsList) {
				usedPaths[fontInfo.filename] = true;
			}
			return this.$store.state.allAssets.filter((path) => {
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
		},
		pages: function() {
			console.log("computing pages");
			return Utils.makePages(
				this.$store.getters.globalOptions,
				this.$store.getters.renderer,
				this.$store.state.cardOptions
			);
		},
	},
	methods: {
		clearCurrentId() {
			this.$store.commit("setCurrentId", null);
		},
		setCurrentId(id) {
			this.$store.commit("setCurrentId", id);
		},
		updateAsset(){
			// noop
		},
		removeAsset(filename){
			// this.$store.dispatch("updateBuffer", filename);
		},
		newCard(){
			let card = Utils.createCard(Object.keys(this.cards), this.fields);
			this.$store.commit("addCardData", card);
		},
		gotoTab(newTab) {
			this.tab = newTab;
		},
		setCurrentField(field) {
			this.currentField = field;
		},
		addField(){
			let field = Utils.createField();
			store.commit("addField", field);
		},
		deleteField(){
			if (confirm("Are you sure you want to delete the field \"" + this.currentField.name + "\" and all data associated with this field?")) {
				this.$store.commit("deleteField", this.currentField);
			}
		},
		moveFieldUp(){
			this.$store.commit("moveField", [ this.currentField, false ]);
		},
		moveFieldDown(){
			this.$store.commit("moveField", [ this.currentField, true ]);
		},
	}
};
//</script>

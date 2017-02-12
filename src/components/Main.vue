<template>
	<div id="vue">
		<div id="f-main">
			<template v-if="cards">
				<div id="f-null" v-on:click="currentCard = null" v-if="cards">
				</div>
				<div id="f-primary">
					<div id="f-top">
						<div id="f-list" v-on:click="currentCard = null">
							<div class="card-list-wrapper" v-if="cards.length">
								<card-list-table v-model="currentCard" :cards="cards" :fields="fieldsWithSerialized"></card-list-table>
							</div>
							<div v-else>
								Hello
								<a v-on:click="newCard">Create New Card</a>
							</div>
						</div>
						<div id="f-preview" v-bind:class="{ 'flex-hide': currentCard === null }">
							<card-svg :aspect-ratio="aspectRatio" :content="currentSvg"></card-svg>
						</div>
					</div>
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
									<li v-for="field in fields" v-on:click="currentField = field" v-bind:class="{ active: currentField === field }">{{ field.name }}</li>
								</ul>
								<button v-on:click="addField">+ Add Field</button>
							</div>
							<div id="f-fields-right">
								<template v-if="currentField">
									<div class="field-box">
										<strong>Name</strong>
										<input v-bind:value="currentField.name" v-on:input="updateName"/>
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
								<asset-upload-box v-on:upload="touch('assets', 'I_options')"></asset-upload-box>
								<asset-box v-for="path in assets" :path="path" v-on:remove="touch('assets', 'I_options')"></asset-box>
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
			<print-page v-for="(page,pageIndex) in pages" :svg-string="page" :page-index="pageIndex" :dims="I_pageDimensions"></print-page>
		</div>
	</div>
</template>

<script>
export default {
	name: "main",
	computed: {
		currentTab: function() {
			return this.$route.params.tab;
		},
		currentId: function() {
			return this.$route.params.currentId;
		}
	}
};
</script>

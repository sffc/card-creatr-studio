/*
 * Copyright (C) 2019 Shane F. Carr
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

"use strict";

const CardCreatr = require("card-creatr");
const Hjson = require("hjson");
const Utils = require("./lib/utils");
const Vue = require("vue/dist/vue");
const Vuex = require("vuex");
const VuexCached = require("./lib/vuex_cached");
const ccsb = require("./lib/ccsb");
const rendererBuilder = require("./lib/renderer");
const md = require("markdown-it")();

Vue.use(Vuex);

const STORE = new Vuex.Store({
	state: {
		templateString: null,
		optionsString: null,
		buffers: {},
		cardData: {},
		cardIds: new Set(),
		cardIdSortOrder: [],
		cardOptions: {},
		fields: [],
		fontsList: [],
		currentId: null,
		currentSvg: null,
		showBack: false,
		printing: false,
		loaded: false,
		gridShown: false,
		allAssets: [],
		errors: {},
	},
	mutations: {
		setTemplateString(state, value) {
			state.templateString = value;
		},
		setOptionsString(state, value) {
			state.optionsString = value;
		},
		setBuffer(state, value) {
			VuexCached.mutation(state.buffers, value);
		},
		addCardData(state, card) {
			// Vue.get prevents triggering other watchers
			Vue.get(state.cardData, card.id, card);
			var newSet = new Set(state.cardIds);
			newSet.add(card.id);
			state.cardIds = newSet;
			state.cardIdSortOrder.push(card.id);
		},
		setCardDataField(state, [ cardId, fieldId, value ]) {
			Vue.set(Vue.get(state.cardData, cardId, {}), fieldId, value);
		},
		moveCard(state, [ cardId, directionDown ]) {
			var oldIndex = state.cardIdSortOrder.indexOf(cardId);
			state.cardIdSortOrder.splice(oldIndex, 1);
			if (directionDown) {
				// Note: splice inserts at end if index > length
				state.cardIdSortOrder.splice(oldIndex + 1, 0, cardId);
			} else {
				// Note: splice inserts at beginning if index < 0
				state.cardIdSortOrder.splice(oldIndex - 1, 0, cardId);
			}
		},
		deleteCard(state, cardId) {
			Vue.delete(state.cardData, cardId);
			var newSet = new Set(state.cardIds);
			newSet.delete(cardId);
			state.cardIds = newSet;
			state.cardIdSortOrder.splice(state.cardIdSortOrder.indexOf(cardId), 1);
			if (state.currentId === cardId) {
				state.currentId = null;
			}
		},
		addField(state, field) {
			state.fields.push(field);
			for (let cardId of Object.keys(state.cardData)) {
				let card = state.cardData[cardId]; // Vue.get() not needed
				if (!card.hasOwnProperty(field.id)) {
					Vue.set(card, field.id, null);
				}
			}
		},
		moveField(state, [ field, isDown ]) {
			let idx = state.fields.indexOf(field);
			if (idx === -1) throw new Error("Unknown field: " + field);
			let newIdx = idx + (isDown ? 1 : -1);
			if (newIdx < 0) newIdx += 1;
			if (newIdx >= state.fields.length) newIdx -= 1;
			state.fields.splice(idx, 1);
			state.fields.splice(newIdx, 0, field);
		},
		deleteField(state, field) {
			let idx = state.fields.indexOf(field);
			if (idx === -1) throw new Error("Unknown field: " + field);
			state.fields.splice(idx, 1);
			for (let cardId of Object.keys(state.cardData)) {
				let card = state.cardData[cardId]; // Vue.get() not needed
				Vue.delete(card, field.id);
			}
		},
		addFont(state, fontInfo) {
			state.fontsList.push(Object.assign(CardCreatr.defaults.getBaseFontInfo(), fontInfo));
		},
		removeFont(state, fontInfo) {
			let idx = state.fontsList.indexOf(fontInfo);
			if (idx === -1) return;
			state.fontsList.splice(idx, 1);
		},
		setCardOptions(state, [ id, value ]) {
			Vue.set(state.cardOptions, id, value);
		},
		clearCardOptions(state, id) {
			Vue.delete(state.cardOptions, id);
		},
		setCurrentId(state, value) {
			state.currentId = value;
		},
		setCurrentSvg(state, value) {
			state.currentSvg = value;
		},
		setShowBack(state, value) {
			state.showBack = value;
		},
		toggleGrid(state) {
			state.gridShown = !state.gridShown;
		},
		updateAllAssets(state) {
			state.allAssets = ccsb.listAllAssets();
		},
		setError(state, [ id, err ]) {
			Vue.set(state.errors, id, err);
		},
		clearError(state, id) {
			Vue.delete(state.errors, id);
		},
		loaded(state, value) {
			state.loaded = value;
		}
	},
	actions: {
		updateBuffer(store, payload) {
			return VuexCached.action(store, "setBuffer", payload, ccsb.readFile.bind(ccsb), payload);
		}
	},
	getters: {
		buffer(state) {
			return (filename) => {
				return VuexCached.getter(state.buffers, filename, STORE, "updateBuffer");
			};
		},
		errors(state) {
			// let allErrors = [].concat(VuexCached.errors(state.buffers));
			let allErrors = [];
			for (let key of Object.keys(state.errors)) {
				allErrors.push([key, state.errors[key]]);
			}
			return allErrors;
		},
		currentCard(state) {
			if (state.currentId === null) return null;
			return Vue.get(state.cardData, state.currentId, null);
		},
		renderer(state, getters) {
			let templateString = state.templateString;
			let globalOptions = getters.globalOptions;
			let gridShown = state.gridShown;
			if (!templateString || !globalOptions) return null;
			console.log("build renderer starting:", new Date().getTime() % 10000);
			try {
				if (gridShown) {
					let gridOptions = globalOptions.get("/grid") || {};
					let viewport = globalOptions.get("/viewports/card") || {};
					templateString += Utils.gridSvg(gridOptions, viewport);
				}
				let result = rendererBuilder.buildCopy(templateString);
				console.log("build renderer ending:", new Date().getTime() % 10000);
				STORE.commit("clearError", "renderer");
				return result;
			} catch(err) {
				console.log("build renderer failed:", new Date().getTime() % 10000);
				STORE.commit("setError", ["renderer", err]);
			}
		},
		globalOptions(state, getters) {
			if (state.optionsString == null) return null;
			console.log("global options starting:", new Date().getTime() % 10000);
			let globalOptions = new (CardCreatr.OptionsParser)();
			try {
				let parsed = Hjson.parse(state.optionsString);
				globalOptions.addPrimary(parsed, getters.buffer); // This line is important! When this watcher attempts to load a file, it actually pulls it from the reactive cache of file buffers.
				// TODO: The following is duplicated in read-and-render.js
				let intermediate = {};
				for (let fontInfo of state.fontsList) {
					intermediate[fontInfo.name + " (font)"] = fontInfo.filename;
				}
				globalOptions.addPrimary({ fonts: intermediate }, getters.buffer);
				globalOptions.addDefaultFallback();
				globalOptions.loadSync();
				console.log("global options ending:", new Date().getTime() % 10000);
				STORE.commit("clearError", "globalOptions");
				return globalOptions;
			} catch(err) {
				console.log("global options failed:", err);
				STORE.commit("setError", ["globalOptions", err]);
				return null;
			}
		},
		getCurrentSvg(state, getters) {
			let cardOptions = Vue.get(state.cardOptions, state.currentId, null);
			let globalOptions = getters.globalOptions;
			let renderer = getters.renderer;
			if (!cardOptions || !globalOptions || !renderer) {
				STORE.commit("clearError", "currentSvg");
				return null;
			}
			console.log("rendering svg starting:", new Date().getTime() % 10000);
			try {
				let result = renderer.render(cardOptions, globalOptions, globalOptions.get("/viewports/card"), {
					__BACK: state.showBack
				});
				console.log("rendering svg ending:", new Date().getTime() % 10000);
				STORE.commit("clearError", "currentSvg");
				return result;
			} catch(err) {
				console.log("rendering svg failed:", new Date().getTime() % 10000);
				STORE.commit("setError", ["currentSvg", err]);
			}
		},
		pageDimensions(state, getters) {
			let globalOptions = getters.globalOptions;
			if (!globalOptions) return null;
			let dims = globalOptions.get("/dimensions/page");
			let styleString = "@page{";
			styleString += `size: ${dims.width}${dims.unit} ${dims.height}${dims.unit};`;
			styleString += "margin: 0;";
			styleString += "}";
			document.getElementById("page-style").textContent = styleString;
			return dims;
		},
		guideHtml(state, getters) {
			let options = getters.globalOptions;
			if (!options) return "no options";
			let markdown = options.get("/guide");
			if (!markdown) return "";
			return md.render(markdown);
		}
	}
});

// Update the SVG at a delay to reduce repaints when the user is typing fast.
// NOTE: Change the frequency in the interval to increase the SVG repaint interval at the cost of lower performance.
setInterval(() => {
	let value = STORE.getters.getCurrentSvg;
	if (value !== STORE.state.currentSvg) {
		STORE.commit("setCurrentSvg", value);
	}
}, 250);

var cardDataWatchers = {};
STORE.watch((state, getters) => { // eslint-disable-line no-unused-vars
	return state.cardIds;
}, (newSet, oldSet) => {
	console.log("card data watchers triggered");
	if (!oldSet) oldSet = new Set();
	if (Utils.setEquals(newSet, oldSet)) return;
	// Cards have been added or removed.
	for (let id of oldSet) {
		if (!newSet.has(id)) {
			// Removed card
			console.log("card options removing watcher:", id);
			cardDataWatchers[id](); // unwatch
			delete cardDataWatchers[id];
			STORE.commit("clearCardOptions", id);
		}
	}
	for (let id of newSet) {
		if (!oldSet.has(id)) {
			// Added card
			cardDataWatchers[id] = STORE.watch((state, getters) => {
				console.log("card options watcher starting:", id, new Date().getTime() % 10000);
				let rawCard = Vue.get(state.cardData, id, null);
				let cardOptions = new (CardCreatr.OptionsParser)();
				let card = Utils.toCardCreatrForm(rawCard, state.fields);
				cardOptions.addPrimary(card, getters.buffer); // This line is important! When this watcher attempts to load a file, it actually pulls it from the reactive cache of file buffers.
				cardOptions.addPrimary(card, (filename) => {
					return getters.buffer(filename);
				});
				try {
					cardOptions.loadSync();
				} catch(err) {
					console.log("card options watcher failed:", id, err);
					return {
						success: false,
						error: err
					};
				}
				console.log("card options watcher ending:", id, new Date().getTime() % 10000);
				return {
					success: true,
					result: cardOptions
				};
			}, (newObj, oldObj) => { // eslint-disable-line no-unused-vars
				if (newObj.success) {
					STORE.commit("setCardOptions", [ id, newObj.result ]);
					STORE.commit("clearError", "cardOptions/" + id);
				} else {
					STORE.commit("setError", [ "cardOptions/" + id, newObj.error ]);
				}
			}, { immediate: true });
		}
	}
}, { immediate: true });

STORE.subscribe((mutation, state) => { // eslint-disable-line no-unused-vars
	let payload = mutation.payload ? (mutation.payload.length < 100 ? mutation.payload : "<long>") : "<empty>";
	console.log("Mutation:", mutation.type, payload, new Date().getTime() % 10000);
});

if (global) {
	global.store = STORE;
} else if (window) {
	window.store = STORE;
}

module.exports = STORE;

"use strict";

const CardCreatr = require("card-creatr");
const Hjson = require("hjson");
const Utils = require("./lib/utils");
const Vue = require("vue/dist/vue");
const Vuex = require("vuex");
const VuexCached = require("./lib/vuex_cached");
const ccsb = require("./lib/ccsb");
const rendererBuilder = require("./lib/renderer");

Vue.use(Vuex);

const STORE = new Vuex.Store({
	state: {
		templateString: null,
		optionsString: null,
		buffers: {},
		cardData: {},
		cardOptions: {},
		rawFields: [],
		currentId: null,
		printing: false,
		errors: {},
	},
	mutations: {
		setTemplateString(state, payload) {
			state.templateString = payload;
		},
		setOptionsString(state, payload) {
			state.optionsString = payload;
		},
		setBuffer(state, payload) {
			VuexCached.mutation(state.buffers, payload);
		},
		addCardData(state, payload) {
			Vue.set(state.cardData, payload.id, payload);
		},
		setCardDataField(state, [ cardId, fieldId, value ]) {
			Vue.set(Vue.get(state.cardData, cardId, {}), fieldId, value);
		},
		addRawField(state, payload) {
			state.rawFields.push(payload);
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
		setError(state, [ id, err ]) {
			Vue.set(state.errors, id, err);
		},
		clearError(state, id) {
			Vue.delete(state.errors, id);
		}
	},
	actions: {
		updateBuffer(store, payload) {
			return VuexCached.action(store, "setBuffer", payload, ccsb.readFile.bind(ccsb), payload);
		}
	},
	getters: {
		fields(state) {
			let result = {};
			state.rawFields.forEach((rawField) => {
				let field = Object.assign({}, rawField);
				field.serialized = CardCreatr.OptionsParser.serializeFieldKey(rawField);
				result[field.id] = field;
			});
			return result;
		},
		errors(state) {
			let allErrors = [].concat(VuexCached.errors(state.buffers));
			for (let key of Object.keys(state.errors)) {
				allErrors.push(state.errors[key]);
			}
			return allErrors;
		},
		renderer(state) {
			if (state.templateString == null) return null;
			console.log("build renderer starting:", new Date().getTime() % 10000);
			try {
				let result = rendererBuilder.buildCopy(state.templateString);
				console.log("build renderer ending:", new Date().getTime() % 10000);
				STORE.commit("clearError", "renderer");
				return result;
			} catch(err) {
				console.log("build renderer failed:", new Date().getTime() % 10000);
				STORE.commit("setError", ["renderer", err]);
			}
		},
		globalOptions(state) {
			if (state.optionsString == null) return null;
			console.log("global options starting:", new Date().getTime() % 10000);
			let globalOptions = new (CardCreatr.OptionsParser)();
			try {
				let parsed = Hjson.parse(state.optionsString);
				globalOptions.addPrimary(parsed, ccsb.readFile.bind(ccsb));
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
		currentSvg(state, getters) {
			let cardOptions = Vue.get(state.cardOptions, state.currentId, null);
			let globalOptions = getters.globalOptions;
			let renderer = getters.renderer;
			if (!cardOptions || !globalOptions || !renderer) return null;
			console.log("rendering svg starting:", new Date().getTime() % 10000);
			try {
				let result = renderer.render(cardOptions, globalOptions, globalOptions.get("/viewports/card"));
				console.log("rendering svg ending:", new Date().getTime() % 10000);
				STORE.commit("clearError", "currentSvg");
				return result;
			} catch(err) {
				console.log("rendering svg failed:", new Date().getTime() % 10000);
				STORE.commit("setError", ["currentSvg", err]);
			}
		},
		pageDimensions(state) {
			let globalOptions = state.globalOptions;
			if (!globalOptions) return null;
			let dims = globalOptions.get("/dimensions/page");
			let styleString = "@page{";
			styleString += `size: ${dims.width}${dims.unit} ${dims.height}${dims.unit};`;
			styleString += "margin: 0;";
			styleString += "}";
			document.getElementById("page-style").textContent = styleString;
			return dims;
		}
	}
});

var cardDataWatchers = {};
STORE.watch((state, getters) => { // eslint-disable-line no-unused-vars
	return new Set(Object.keys(state.cardData));
}, (newSet, oldSet) => {
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
				let card = Utils.toCardCreatrForm(rawCard, getters.fields);
				cardOptions.addPrimary(card, getters.buffer);
				cardOptions.addPrimary(card, (filename) => {
					return VuexCached.getter(state.buffers, filename, STORE, "updateBuffer");
				});
				try {
					cardOptions.loadSync();
				} catch(err) {
					console.log("card options watcher failed:", id, err);
					return null;
				}
				console.log("card options watcher ending:", id, new Date().getTime() % 10000);
				return cardOptions;
			}, (newOptions, oldOptions) => { // eslint-disable-line no-unused-vars
				STORE.commit("setCardOptions", [ id, newOptions ]);
			}, { immediate: true });
		}
	}
}, { immediate: true });

STORE.subscribe((mutation, state) => { // eslint-disable-line no-unused-vars
	console.log("Mutation:", mutation.type, mutation.payload);
});

if (global) {
	global.store = STORE;
} else if (window) {
	window.store = STORE;
}

module.exports = STORE;

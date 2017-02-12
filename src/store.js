"use strict";

const CardCreatr = require("card-creatr");
const Utils = require("./lib/utils");
const Vue = require("vue");
const Vuex = require("vuex");
const VuexCached = require("./lib/vuex_cached");
const ccsb = require("./lib/ccsb");

Vue.use(Vuex);

const STORE = new Vuex.Store({
	state: {
		templateString: "",
		optionsString: "",
		buffers: {},
		cardData: {},
		cardOptions: {},
		rawFields: [],
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
		addRawField(state, payload) {
			state.rawFields.push(payload);
		}
	},
	actions: {
		updateBuffer(store, payload) {
			return VuexCached.action(store, "setBuffer", payload, ccsb.readFile.bind(ccsb), payload);
		}
	},
	getters: {
		buffer(state) {
			return VuexCached.getter(state.buffers);
		},
		fields(state) { // eslint-disable-line no-unused-vars
			return state.rawFields.map((rawField) => {
				let field = Object.assign({}, rawField);
				field.serialized = CardCreatr.OptionsParser.serializeFieldKey(rawField);
				return field;
			});
		},
		errors(state) {
			let allErrors = [];
			allErrors = allErrors.concat(VuexCached.errors(state.buffers));
			return allErrors;
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
			// TODO: Should we use a mutation here?
			Vue.delete(STORE.state.cardOptions, id);
		}
	}
	for (let id of newSet) {
		if (!oldSet.has(id)) {
			// Added card
			cardDataWatchers[id] = STORE.watch((state, getters) => {
				console.log("card options watcher starting:", id, new Date().getTime() % 10000);
				let cardOptions = new (CardCreatr.OptionsParser)();
				let card = Utils.toCardCreatrForm(state.cardData[id], getters.fields);
				cardOptions.addPrimary(card, getters.buffer);
				try {
					cardOptions.loadSync();
				} catch(err) {
					console.log("card options watcher failed:", id, err);
					return null;
				}
				console.log("card options watcher ending:", id, new Date().getTime() % 10000);
				return cardOptions;
			}, (newOptions, oldOptions) => { // eslint-disable-line no-unused-vars
				// TODO: Should we use a mutation here?
				STORE.state.cardOptions[id] = newOptions;
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

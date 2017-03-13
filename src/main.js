"use strict";

require.extensions[".vue"] = require.extensions[".js"];

const Vue = require("vue/dist/vue");
const App = require("./App");
const CardCreatr = require("card-creatr");
const Utils = require("./lib/utils");
const async = require("async");
const store = require("./store");
const ccsb = require("./lib/ccsb");
const renderer = require("./lib/renderer");
const electron = require("electron");

/* eslint-disable no-new */
const vm = new Vue({
	el: "#app",
	template: "<App/>",
	store,
	components: { App }
});

if (global) {
	global.vm = vm;
} else if (window) {
	window.vm = vm;
}

// Messages from main process
electron.ipcRenderer.on("path", (event, message) => {
	ccsb.setPath(message.path);
});
electron.ipcRenderer.on("save", (event, message) => {
	ccsb.writeFile(CardCreatr.CcsbReader.CONFIG_PATH, Buffer.from(store.state.optionsString));
	ccsb.writeFile(CardCreatr.CcsbReader.TEMPLATE_PATH, Buffer.from(store.state.templateString));
	ccsb.writeFile(CardCreatr.CcsbReader.JSON_PATH, Buffer.from(JSON.stringify({
		fields: store.state.fields,
		fonts: store.state.fontsList
	})));
	let intermediate = Object.keys(store.state.cardData).map((cardId) => {
		let card = store.state.cardData[cardId];
		return Utils.toCardCreatrForm(card, store.state.fields);
	});
	CardCreatr.csv.objectsToCsvBuffer(intermediate, (err, csvBuffer) => {
		ccsb.writeFile(CardCreatr.CcsbReader.DATA_PATH, csvBuffer);
		ccsb.save(() => {
			electron.ipcRenderer.send("dirty", { isDirty: false });
			electron.ipcRenderer.send("saved", { id: message.id });
		});
	});
});
electron.ipcRenderer.on("print", (event, message) => {
	store.state.printing = true;
	setTimeout(() => {
		window.print();
		console.log("hi");
		store.state.printing = false;
	}, 0);
});

// Dirty watchers: update the title bar to show when the file has been modified
function makeDirtyWatchers() {
	store.watch((state) => state.cardData, (oldValue, newValue) => {
		if (oldValue) {
			electron.ipcRenderer.send("dirty", { isDirty: true });
		}
	}, { deep: true });
	store.watch((state) => state.fields, (oldValue, newValue) => {
		if (oldValue) {
			electron.ipcRenderer.send("dirty", { isDirty: true });
		}
	}, { deep: true });
	store.watch((state) => state.fontsList, (oldValue, newValue) => {
		if (oldValue) {
			electron.ipcRenderer.send("dirty", { isDirty: true });
		}
	}, { deep: true });
	store.watch((state) => state.optionsString, (oldValue, newValue) => {
		if (oldValue) {
			electron.ipcRenderer.send("dirty", { isDirty: true });
		}
	});
	store.watch((state) => state.templateString, (oldValue, newValue) => {
		if (oldValue) {
			electron.ipcRenderer.send("dirty", { isDirty: true });
		}
	});
}

// Initial setup
async.auto({
	"load": (_next) => {
		ccsb.load(_next);
	},
	"rendererLoad": (_next) => {
		renderer.load(_next);
	},
	"dataBuffer": ["load", (results, _next) => {
		ccsb.readFile(CardCreatr.CcsbReader.DATA_PATH, _next);
	}],
	"configBuffer": ["load", (results, _next) => {
		ccsb.readFile(CardCreatr.CcsbReader.CONFIG_PATH, _next);
	}],
	"templateBuffer": ["load", (results, _next) => {
		ccsb.readFile(CardCreatr.CcsbReader.TEMPLATE_PATH, _next);
	}],
	"jsonBuffer": ["load", (results, _next) => {
		ccsb.readFile(CardCreatr.CcsbReader.JSON_PATH, _next);
	}],
	"loadAssets": ["load", (results, _next) => {
		store.commit("updateAllAssets");
		async.each(
			ccsb.listAllAssets(),
			(filename, __next) => {
				let promise = store.dispatch("updateBuffer", filename);
				promise.then(() => {
					__next(null);
				}, (err) => {
					__next(err);
				});
			},
			_next
		);
	}],
	"dataObjects": ["dataBuffer", (results, _next) => {
		CardCreatr.csv.csvBufferToObjects(results.dataBuffer, _next);
	}],
	"resolveConfig": ["configBuffer", (results, _next) => {
		store.commit("setOptionsString", results.configBuffer.toString("utf-8"));
		_next(null);
	}],
	"resolveTemplate": ["templateBuffer", (results, _next) => {
		store.commit("setTemplateString", results.templateBuffer.toString("utf-8"));
		_next(null);
	}],
	"resolveBuffer": ["jsonBuffer", (results, _next) => {
		try {
			let jsonObj = JSON.parse(results.jsonBuffer.toString("utf-8"));
			if (!jsonObj) return _next(null);
			for (let field of (jsonObj.fields || [])) {
				field = Utils.createField(field);
				store.commit("addField", field);
			}
			for (let fontInfo of (jsonObj.fonts || [])) {
				store.commit("addFont", fontInfo);
			}
		} catch(_err) {
			return _next(_err);
		}
		_next(null);
	}],
	"resolveData": ["dataObjects", "resolveBuffer", "loadAssets", (results, _next) => {
		for (let card of results.dataObjects) {
			let _card = Utils.toCardIdForm(card, store.state.fields);
			_card.id = card.id;
			store.commit("addCardData", _card);
		}
		_next(null);
	}],
}, (err) => {
	if (err) {
		alert("Your file might be corrupted.\n\n" + err);
		console.error(err);
	}
	makeDirtyWatchers();
	store.commit("loaded", true);
});

"use strict";

const path = require("path");
const Module = require("module").Module;
if (__dirname.indexOf("app.asar") !== -1) {
	// slimerjs and slimerjs-capture and its dependencies (tmp and os-tmpdir) are not designed to work inside of an asar archive.  This small hack tells Node to use the "unpacked" version of those modules.
	const oldNodeModulePaths = Module._nodeModulePaths;
	const unpackedPath = path.resolve(__dirname, "../../app.asar.unpacked/node_modules");
	Module._nodeModulePaths = function() {
		return [unpackedPath].concat(oldNodeModulePaths.apply(this, arguments));
	}
	console.log("Added node module search path:", unpackedPath);
}

require.extensions[".vue"] = require.extensions[".js"];

const Vue = require("vue/dist/vue");
const App = require("./App");
const CardCreatr = require("card-creatr");
const Utils = require("./lib/utils");
const async = require("async");
const store = require("./store");
const ccsb = require("./lib/ccsb");
const renderer = require("./lib/renderer");
const pagePrinterFallback = require("./lib/page_printer_fallback");
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
electron.ipcRenderer.on("print", (event, message) => {
	store.state.printing = true;
	// TODO: Setting a nonzero timeout here is a hack.  Without it, the browser does not always render fonts correctly in the SVG.  Could be a bug in Chromium.
	setTimeout(() => {
		window.print();
		setTimeout(() => {
			store.state.printing = false;
		}, 500);
	}, 1000);
});
electron.ipcRenderer.on("print2", (event, message) => {
	pagePrinterFallback.printSlimerJS(message, (err) => {
		if (err) {
			console.error(err);
			alert("Error: " + err.message);
		}
		else alert("File export is finished");
	});
});
electron.ipcRenderer.on("print3", (event, message) => {
	vm.$children[0].$data.spinnerCount++;
	vm.$children[0].$data.spinnerText = "Calculating…";
	pagePrinterFallback.printCanvas(message, (status) => {
		let action;
		switch(status.name) {
		case "init":
			action = "Initialized";
			break;
		case "canvas":
			action = "Rendered";
			break;
		case "blob":
			action = "Processed";
			break;
		}
		vm.$children[0].$data.spinnerText = action + " page #" + (status.page+1) + "…";
	}, (err) => {
		vm.$children[0].$data.spinnerCount--;
		if (err) {
			console.error(err);
			alert("Error: " + err.message);
		}
		else alert("File export is finished");
	});
});
electron.ipcRenderer.on("addcard", (event, message) => {
	vm.$children[0].newCard();
});
electron.ipcRenderer.on("deletecard", (event, message) => {
	let card = store.getters.currentCard;
	if (!card) return alert("Please select a card first.");
	if (confirm("Are you sure you want to delete the current card?\n\n"+JSON.stringify(card))) {
		store.commit("deleteCard", store.state.currentId);
	}
});
electron.ipcRenderer.on("toggleGrid", (event, message) => {
	store.commit("toggleGrid");
});
electron.ipcRenderer.on("_SAR", (event, data) => {
	let id = data.id;
	let _sendResponse = (response) => {
		electron.ipcRenderer.send("_SAR", { id, response });
	}
	if (data.name === "save") {
		electronDoSave(data.message, _sendResponse);
	} else if (data.name === "getsvg") {
		electronDoGetSvg(data.message, _sendResponse);
	}
});

function electronDoSave(message, next) {
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
			next();
		});
	});
};

function electronDoGetSvg(message, next) {
	console.log("Getting SVG...");
	let response = pagePrinterFallback.getSvg();
	next(response);
}

// Dirty watchers: update the title bar to show when the file has been modified
function makeDirtyWatchers() {
	store.watch((state) => {
		for (let cardId of state.cardIds) Vue.get(state.cardData, cardId, null);
		return state.cardData;
	}, (oldValue, newValue) => {
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
	store.watch((state) => state.allAssets, (oldValue, newValue) => {
		if (oldValue) {
			electron.ipcRenderer.send("dirty", { isDirty: true });
		}
	});
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

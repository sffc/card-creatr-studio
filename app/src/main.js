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

const path = require("path");
const Module = require("module").Module;
if (__dirname.indexOf("app.asar") !== -1) {
	// slimerjs and slimerjs-capture and its dependencies (tmp and os-tmpdir) are not designed to work inside of an asar archive.  This small hack tells Node to use the "unpacked" version of those modules.
	const oldNodeModulePaths = Module._nodeModulePaths;
	const unpackedPath = path.resolve(__dirname, "../../app.asar.unpacked/node_modules");
	Module._nodeModulePaths = function() {
		return [unpackedPath].concat(oldNodeModulePaths.apply(this, arguments));
	};
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
const svgXml = require("./lib/svg_xml");
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

function ipcStatusUpdate(status) {
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
	case "error":
		action = "Error";
		break;
	}
	vm.$children[0].$data.spinnerText = action + " page #" + (status.page+1) + "…";
}

document.body.addEventListener("click", (event) => {
	const element = event.target;
	if (element && element.matches("a[target='_blank']")) {
		event.preventDefault();
		electron.shell.openExternal(element.href);
	}
});


// Messages from main process
electron.ipcRenderer.on("path", (event, message) => {
	ccsb.setPath(message.path);
});
electron.ipcRenderer.on("print", (/* event, message */) => {
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
	pagePrinterFallback.printPageCanvasPdf(message, ipcStatusUpdate, (err) => {
		vm.$children[0].$data.spinnerCount--;
		if (err) {
			console.error(err);
			alert("Error: " + err.message);
		}
		else alert("File export is finished");
	});
});
electron.ipcRenderer.on("print4", (event, message) => {
	vm.$children[0].$data.spinnerCount++;
	vm.$children[0].$data.spinnerText = "Calculating…";
	pagePrinterFallback.printPageCanvasPdf2(message, ipcStatusUpdate, (err) => {
		vm.$children[0].$data.spinnerCount--;
		if (err) {
			console.error(err);
			alert("Error: " + err.message);
		}
		else alert("File export is finished");
	});
});
electron.ipcRenderer.on("cardImages1", (event, message) => {
	vm.$children[0].$data.spinnerCount++;
	vm.$children[0].$data.spinnerText = "Calculating…";
	pagePrinterFallback.printCardCanvasZip(message, ipcStatusUpdate, (err) => {
		vm.$children[0].$data.spinnerCount--;
		if (err) {
			console.error(err);
			alert("Error: " + err.message);
		}
		else alert("File export is finished");
	});
});
electron.ipcRenderer.on("addcard", (/* event, message */) => {
	vm.$children[0].newCard();
});
electron.ipcRenderer.on("movecardup", (/* event, message */) => {
	if (store.getters.selectedCards.length === 0) return alert("Please select a card first.");
	store.commit("moveCards", false);
});
electron.ipcRenderer.on("movecarddown", (/* event, message */) => {
	if (store.getters.selectedCards.length === 0) return alert("Please select a card first.");
	store.commit("moveCards", true);
});
electron.ipcRenderer.on("deletecard", (/* event, message */) => {
	let cards = store.getters.selectedCards;
	if (cards.length === 0) return alert("Please select a card first.");
	if (confirm("Are you sure you want to delete the selected cards?\n\n"+JSON.stringify(cards))) {
		store.commit("deleteCards");
	}
});
electron.ipcRenderer.on("toggleGrid", (/* event, message */) => {
	store.commit("toggleGrid");
});
electron.ipcRenderer.on("viewSvgXml", (/* event, message */) => {
	svgXml.open(store.state.currentSvg);
});
electron.ipcRenderer.on("_SAR", (event, data) => {
	let id = data.id;
	let _sendResponse = (response) => {
		electron.ipcRenderer.send("_SAR", { id, response });
	};
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
	let intermediate = store.state.cardIdSortOrder.map((cardId) => {
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
}

function electronDoGetSvg(message, next) {
	console.log("Getting SVG...");
	let response = pagePrinterFallback.getPageSvg();
	next(response);
}

// Dirty watchers: update the title bar to show when the file has been modified
function makeDirtyWatchers() {
	store.watch((state) => {
		for (let cardId of state.cardIds) Vue.get(state.cardData, cardId, null);
		return state.cardData;
	}, (oldValue /* , newValue */) => {
		if (oldValue) {
			electron.ipcRenderer.send("dirty", { isDirty: true, cause: "card" });
		}
	}, { deep: true });
	store.watch((state) => state.fields, (oldValue /* , newValue */) => {
		if (oldValue) {
			electron.ipcRenderer.send("dirty", { isDirty: true, cause: "field" });
		}
	}, { deep: true });
	store.watch((state) => state.fontsList, (oldValue /* , newValue */) => {
		if (oldValue) {
			electron.ipcRenderer.send("dirty", { isDirty: true, cause: "font" });
		}
	}, { deep: true });
	store.watch((state) => state.allAssets, (oldValue /* , newValue */) => {
		if (oldValue) {
			electron.ipcRenderer.send("dirty", { isDirty: true, cause: "asset" });
		}
	});
	store.watch((state) => state.optionsString, (oldValue /* , newValue */) => {
		if (oldValue) {
			electron.ipcRenderer.send("dirty", { isDirty: true, cause: "options" });
		}
	});
	store.watch((state) => state.templateString, (oldValue /* , newValue */) => {
		if (oldValue) {
			electron.ipcRenderer.send("dirty", { isDirty: true, cause: "template" });
		}
	});
	store.watch((state) => state.cardIdSortOrder, (oldValue /* , newValue */) => {
		if (oldValue) {
			electron.ipcRenderer.send("dirty", { isDirty: true, cause: "sorting" });
		}
	});
}

// Other listeners
function makeOtherWatchers() {
	store.subscribe((mutation /* , state */) => {
		if (mutation.type === "setCurrentSvg") {
			svgXml.update(mutation.payload);
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
	"resolveJson": ["jsonBuffer", (results, _next) => {
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
	"resolveData": ["dataObjects", "resolveJson", "loadAssets", (results, _next) => {
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
	makeOtherWatchers();
	store.commit("loaded", true);
});

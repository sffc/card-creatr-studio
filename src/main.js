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
// electron.ipcRenderer.on("save", (event, message) => {
// 	ccsb.writeFile(CardCreatr.CcsbReader.CONFIG_PATH, Buffer.from(vm.optionsString));
// 	ccsb.writeFile(CardCreatr.CcsbReader.TEMPLATE_PATH, Buffer.from(vm.templateString));
// 	ccsb.writeFile(CardCreatr.CcsbReader.FIELDS_PATH, Buffer.from(JSON.stringify({ fields: vm.fields })));
// 	CardCreatr.csv.objectsToCsvBuffer(vm.cards, (err, csvBuffer) => {
// 		ccsb.writeFile(CardCreatr.CcsbReader.DATA_PATH, csvBuffer);
// 		ccsb.save(() => {
// 			electron.ipcRenderer.send("dirty", { isDirty: false });
// 			electron.ipcRenderer.send("saved", { id: message.id });
// 		});
// 	});
// });
// electron.ipcRenderer.on("print", (event, message) => {
// 	vm.printing = true;
// 	setTimeout(() => {
// 		window.print();
// 		console.log("hi");
// 		vm.printing = false;
// 	}, 0);
// });

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
	"fieldsBuffer": ["load", (results, _next) => {
		ccsb.readFile(CardCreatr.CcsbReader.FIELDS_PATH, _next);
	}],
	"loadAssets": ["load", (results, _next) => {
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
	"resolveFields": ["fieldsBuffer", (results, _next) => {
		try {
			let jsonObj = JSON.parse(results.fieldsBuffer.toString("utf-8"));
			if (!jsonObj || !jsonObj.fields) return _next(null);
			for (let field of jsonObj.fields) {
				let _field = Object.assign(CardCreatr.defaults.getBaseField(), field);
				_field.id = Utils.minid();
				store.commit("addRawField", _field);
			}
		} catch(_err) {
			return _next(_err);
		}
		_next(null);
	}],
	"resolveData": ["dataObjects", "resolveFields", "loadAssets", (results, _next) => {
		for (let card of results.dataObjects) {
			let _card = Utils.toCardIdForm(card, store.getters.fields);
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
});

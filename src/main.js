// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from "vue";
import App from "./App";
import CardCreatr from "card-creatr";
import Utils from "./lib/utils";
import async from "async";
import router from "./router";
import store from "./store";
import ccsb from "./lib/ccsb";
import electron from "electron";

/* eslint-disable no-new */
new Vue({
	el: "#app",
	router,
	template: "<App/>",
	components: { App }
});

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
				_field.id = Utils.uuid();
				store.commit("addRawField", _field);
			}
		} catch(_err) {
			return _next(_err);
		}
		_next(null);
	}],
	"resolveData": ["dataObjects", "resolveFields", (results, _next) => {
		for (let card of results.dataObjects) {
			let _card = Utils.toCardIdForm(card, store.state.fields);
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

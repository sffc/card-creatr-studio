"use strict";

const uuidV4 = require("uuid/v4");
const CardCreatr = require("card-creatr");
const Vue = require("vue/dist/vue");

// // Custom function: Vue.get()
// Vue.get = function(obj, key, defaultValue) {
// 	if (!obj.hasOwnProperty(key)) {
// 		Vue.set(obj, key, defaultValue, { notify: false });
// 	}
// 	return obj[key];
// };

function setEquals(set1, set2) {
	if (set1.size !== set2.size) return false;
	for (var a of set1) if (!set2.has(a)) return false;
	return true;
}

function toCardIdForm(card, fields) {
	let output = {};
	for (let field of fields) {
		field = Object.assign(CardCreatr.defaults.getBaseField(), field);
		let serialized = CardCreatr.utils.serializeFieldKey(field);
		output[field.id] = card[serialized] || null;
	}
	return output;
}

function toCardCreatrForm(card, fields) {
	let output = {};
	for (let field of fields) {
		field = Object.assign(CardCreatr.defaults.getBaseField(), field);
		let serialized = CardCreatr.utils.serializeFieldKey(field);
		output[serialized] = card[field.id] || null;
	}
	return output;
}

function uuid() {
	return uuidV4();
}

var globalCounterMinid = 1;
function minid() {
	var sn = "0000" + (globalCounterMinid++);
	if (sn.length < 9) {
		sn = sn.slice(-5);
	}
	return "f" + sn;
}

function fileSizeString(bytes) {
	let pow1k = Math.floor(Math.log10(bytes)/3);
	let unit = (pow1k <= 4) ? ["bytes", "kB", "MB", "GB", "TB"][pow1k] : "giant";
	let divisor = Math.pow(1000, pow1k);
	return (Math.round(bytes/divisor*10)/10) + " " + unit;
}

function createCard(existingIds, fields) {
	var id;
	var maxId = "";
	var i = 0;
	for (let _id of existingIds) {
		if (_id > maxId) {
			maxId = _id;
		}
	}
	do {
		id = "id" + (1e6 + (i++));
	} while (id <= maxId);
	let card = { id };
	for (let field of fields) {
		if (field.display === "color") {
			// Default color (soft royal blue)
			card[field.id] = "#5555FF";
		} else if (field.display === "number") {
			// Default number (1)
			card[field.id] = 1;
		} else {
			card[field.id] = null;
		}
	}
	return card;
}

function createField(template) {
	if (!template) template = {
		name: "untitled"
	};
	let field = Object.assign(CardCreatr.defaults.getBaseField(), template);
	field.id = minid();
	return field;
}

function makePages(options, renderer, allCardOptions, concatenated) {
	if (!options || !renderer || !allCardOptions) return null;
	let cardSvgStrings = [];
	try {
		for (let cardId of Object.keys(allCardOptions)) {
			let cardOptions = allCardOptions[cardId];
			if (!cardOptions) continue;
			let qty = parseInt(cardOptions.get("/qty"));
			if (isNaN(qty)) qty = 1;
			if (qty == 0) continue;
			let str = renderer.render(cardOptions, options, options.get("/viewports/card"));
			for (let q=0; q<qty; q++) {
				cardSvgStrings.push(str);
			}
		}
	} catch(err) {
		throw err;
	}
	// TODO: make strategy and reversed options
	let strategy = "tight";
	let reversed = false;
	let pageRenderer = new (CardCreatr.PageRenderer)(options.get("/viewports/page"), strategy, reversed);
	if (concatenated) {
		return pageRenderer.renderConcatenated(cardSvgStrings);
	} else {
		return pageRenderer.render(cardSvgStrings);
	}
}

function finalizeSvg(innerSvg, dims, options, noUnits, numPages, scale) {
	if (!innerSvg || !dims || !options) return null;
	let aspectRatio = dims.width / dims.height;
	let _dims = noUnits ? { width: aspectRatio, height: 1, unit: "" } : Object.assign({}, dims);
	if (!noUnits) {
		_dims.width *= scale;
		_dims.height *= scale;
	}
	let svgHolder = new (CardCreatr.SvgHolder)();
	svgHolder.dims = _dims;
	svgHolder.fonts = options.get("/fonts");
	svgHolder.writeFontFaceCSS = (options.get("/fontRenderMode") === "auto");
	svgHolder.numPages = numPages;
	svgHolder.content = innerSvg;
	return svgHolder.finalizeToBuffer().toString("utf-8");
}

module.exports = {
	setEquals,
	toCardIdForm,
	toCardCreatrForm,
	uuid,
	minid,
	fileSizeString,
	createCard,
	createField,
	makePages,
	finalizeSvg
};

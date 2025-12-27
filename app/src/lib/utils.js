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

const Vue = require("@vue/compat");
const uuidV4 = require("uuid/v4");
const CardCreatr = require("card-creatr");

// // Custom function: Vue.get()
// Vue.get = function(obj, key, defaultValue) {
// 	if (!obj.hasOwnProperty(key)) {
// 		Vue.set(obj, key, defaultValue, { notify: false });
// 	}
// 	return obj[key];
// };

/// Updated version of Vue.get() based on Vue.observable()
/// Similar to Vue.set() but doesn't trigger notificatins on the container
function vueGetOrDefault(obj, key, defaultVal) {
	if (Array.isArray(obj)) {
		return obj[key];
	}
	if (Object.prototype.hasOwnProperty.call(obj, key)) {
		return obj[key];
	}
	if (!obj.__ob__) {
		obj[key] = defaultVal;
	} else {
		obj[key] = Vue.observable(defaultVal);
	}
	return obj[key];
}

function setEquals(set1, set2) {
	if (set1.size !== set2.size) return false;
	for (let a of set1) if (!set2.has(a)) return false;
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

let globalCounterMinid = 1;
function minid() {
	let sn = "0000" + (globalCounterMinid++);
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
	let id;
	let maxId = "";
	let i = 0;
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

function makeCardSvgs(options, renderer, allCardOptions, { showBack, useQty }) {
	if (!options || !renderer || !allCardOptions) return null;
	let cardSvgStrings = [];
	try {
		for (let cardId of Object.keys(allCardOptions)) {
			let cardOptions = allCardOptions[cardId];
			if (!cardOptions) continue;
			let qty = parseInt(cardOptions.get("/qty"));
			if (isNaN(qty) || !useQty) qty = 1;
			if (qty == 0) continue;
			let str = renderer.render(cardOptions, options, options.get("/viewports/card"), {
				__BACK: showBack
			});
			for (let q=0; q<qty; q++) {
				cardSvgStrings.push(str);
			}
		}
	} catch(err) {
		throw err;
	}
	return cardSvgStrings;
}

function makePageSvg(options, renderer, allCardOptions, { concatenated, showBack }) {
	if (!options || !renderer || !allCardOptions) return null;
	let cardSvgStrings = makeCardSvgs(options, renderer, allCardOptions, {
		showBack,
		useQty: true
	});
	let pageRenderer = new (CardCreatr.PageRenderer)(options.get("/viewports/page"), options.get("/layoutStrategy"), !!showBack);
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

function resized() {
	// Fire a window "resize" event to make sure everything adjusts,
	// like the ACE editor
	let evt = document.createEvent("UIEvents");
	evt.initUIEvent("resize", true, false, window, 0);
	window.dispatchEvent(evt);
}

function gridSvg(gridOptions, viewport) {
	const size = gridOptions.size || 12;
	const color = gridOptions.color || "skyblue";
	const opacity = gridOptions.opacity || 0.5;
	const weight = gridOptions.weight || 1;
	return `
pattern(id="cc-layout-grid", x=0, y=0, width=${size}, height=${size}, patternUnits="userSpaceOnUse")
	rect(x=0, y=0, width=${weight/2}, height=${size}, fill="${color}", opacity=${opacity})
	rect(x=${weight/2}, y=0, width=${size-weight}, height=${weight/2}, fill="${color}", opacity=${opacity})
	rect(x=${size-weight/2}, y=0, width=${weight/2}, height=${size}, fill="${color}", opacity=${opacity})
	rect(x=${weight/2}, y=${size-weight/2}, width=${size-weight}, height=${weight/2}, fill="${color}", opacity=${opacity})
rect(fill="url(#cc-layout-grid)", width=${viewport.width}, height=${viewport.height})
`;
}

module.exports = {
	vueGetOrDefault,
	setEquals,
	toCardIdForm,
	toCardCreatrForm,
	uuid,
	minid,
	fileSizeString,
	createCard,
	createField,
	makeCardSvgs,
	makePageSvg,
	finalizeSvg,
	resized,
	gridSvg
};

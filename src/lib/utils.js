"use strict";

const uuidV4 = require("uuid/v4");
const Vue = require("vue/dist/vue");

// Custom function: Vue.get()
Vue.get = function(obj, key, defaultValue) {
	if (!obj.hasOwnProperty(key)) {
		Vue.set(obj, key, defaultValue, { notify: false });
	}
	return obj[key];
};

function setEquals(set1, set2) {
	if (set1.size !== set2.size) return false;
	for (var a of set1) if (!set2.has(a)) return false;
	return true;
}

function toCardIdForm(card, fields) {
	let output = {};
	for (let fieldId of Object.keys(fields)) {
		let field = fields[fieldId];
		output[field.id] = card[field.serialized] || null;
	}
	return output;
}

function toCardCreatrForm(card, fields) {
	let output = {};
	for (let fieldId of Object.keys(fields)) {
		let field = fields[fieldId];
		output[field.serialized] = card[field.id] || null;
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

module.exports = {
	setEquals,
	toCardIdForm,
	toCardCreatrForm,
	uuid,
	minid,
	fileSizeString
};

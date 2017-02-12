import uuidV4 from "uuid/v4";

function setEquals(set1, set2) {
	if (set1.size !== set2.size) return false;
	for (var a of set1) if (!set2.has(a)) return false;
	return true;
}

function toCardIdForm(card, fields) {
	let output = {};
	for (let field of fields) {
		output[field.id] = card[field.serialized] || null;
	}
	return output;
}

function toCardCreatrForm(card, fields) {
	let output = {};
	for (let field of fields) {
		output[field.serialized] = card[field.id] || null;
	}
	return output;
}

function uuid() {
	return uuidV4();
}

export default {
	setEquals,
	toCardIdForm,
	toCardCreatrForm,
	uuid
};

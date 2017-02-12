"use strict";

const Vue = require("vue");

var globalCounter = 0;

function action(store, mutationName, key, callback, ...callbackArgs) {
	let stamp = globalCounter++;
	return new Promise((resolve, reject) => {
		callback(...callbackArgs, (err, value) => {
			store.commit(mutationName, { err, stamp, key, value });
			resolve();
		});
	});
}

function mutation(collection, { err, stamp, key, value }) {
	if (!collection.hasOwnProperty(key)) {
		// Initial load
		Vue.set(collection, key, {
			err,
			errStamp: stamp,
			value,
			valueStamp: (value ? stamp : -1)
		});
	} else {
		// Update
		let obj = collection[key];
		if (obj.errStamp < stamp) {
			obj.err = err;
			obj.errStamp = stamp;
		}
		if (value && obj.valueStamp < stamp) {
			obj.value = value;
			obj.valueStamp = stamp;
		}
	}
}

function getter(collection) {
	return (key) => {
		if (!collection.hasOwnProperty(key)) {
			return null;
		} else if (!collection[key].value) {
			return null;
		} else {
			return collection[key].value;
		}
	};
}

function errors(collection) {
	let result = [];
	for (let key of Object.keys(collection)) {
		if (collection[key].err) {
			result.push(collection[key].err);
		}
	}
	return result;
}

module.exports = {
	action,
	mutation,
	getter,
	errors
};

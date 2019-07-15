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

const Vue = require("vue/dist/vue");

var globalCounter = 0;

function makeDefault() {
	return {
		err: null,
		errStamp: -1,
		value: null,
		valueStamp: -1
	};
}

function action(store, mutationName, key, callback, ...callbackArgs) {
	let stamp = globalCounter++;
	return new Promise((resolve/*,reject*/) => {
		callback(...callbackArgs, (err, value) => {
			store.commit(mutationName, { err, stamp, key, value });
			resolve();
		});
	});
}

function mutation(collection, { err, stamp, key, value }) {
	let obj = Vue.get(collection, key, makeDefault());
	if (obj.errStamp < stamp) {
		obj.err = err || null;
		obj.errStamp = stamp;
	}
	if (value && obj.valueStamp < stamp) {
		obj.value = value || null;
		obj.valueStamp = stamp;
	}
}

function getter(collection, key, store, actionName) {
	if (!collection.hasOwnProperty(key)) {
		// Request that the key be loaded
		console.log("Getter load dispatch for:", key);
		store.dispatch(actionName, key);
	}
	return Vue.get(collection, key, makeDefault()).value;
}

function errors(collection) {
	let result = [];
	for (let key of Object.keys(collection)) {
		if (collection[key].err) {
			result.push(["cached/" + key, collection[key].err]);
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

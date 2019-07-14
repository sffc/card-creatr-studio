"use strict";

const CardCreatr = require("card-creatr");
const url = require("url");

const ccsb = new (CardCreatr.CcsbReader)(url.parse(window.location.href, { parseQueryString: true }).query.path || null);

const oldWriteFile = ccsb.writeFile;
const oldCreateFile = ccsb.createFile;
const oldRemoveFile = ccsb.removeFile;

ccsb.writeFile = function() {
	var ret = oldWriteFile.apply(ccsb, arguments);
	require("../store").commit("updateAllAssets");
	return ret;
};

ccsb.createFile = function() {
	var ret = oldCreateFile.apply(ccsb, arguments);
	require("../store").commit("updateAllAssets");
	return ret;
};

ccsb.removeFile = function() {
	var ret = oldRemoveFile.apply(ccsb, arguments);
	require("../store").commit("updateAllAssets");
	return ret;
};

module.exports = ccsb;

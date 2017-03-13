"use strict";

module.exports = {};

const http = require("http");
const https = require("https");
const mime = require("mime");

const apiKey = "AIzaSyAgQiZdbJp_1uGqQeE1p2jpDEtkzUzoBTg";

var fontListPromise = null;
var fontList = null;

function getUrl(url, next) {
	var fn = (url[4] === "s") ? https : http;
	fn.get(url, (res) => {
		var buffers = [];
		res.on("data", function(chunk) {
			buffers.push(chunk);
		});
		res.on("end", function() {
			next(null, Buffer.concat(buffers));
		});
	}, (err) => {
		next(err);
	});
}

function ensureLoaded(next) {
	if (fontList) {
		next();
	} else {
		if (!fontListPromise) {
			fontListPromise = new Promise((resolve, reject) => {
				getUrl("https://www.googleapis.com/webfonts/v1/webfonts?sort=popularity&key="+apiKey, (err, string) => {
					if (err) {
						console.error(err);
						fontList = [];
					} else {
						fontList = JSON.parse(string).items;
					}
					resolve();
				});
			});
		}
		fontListPromise.then(next, next);
	}
}

function getNameList(next) {
	ensureLoaded(() => {
		next(fontList.map((details) => {
			return details.family;
		}));
	});
}

function getVariants(fontName, next) {
	ensureLoaded(() => {
		for (let details of fontList) {
			if (details.family === fontName) {
				next(null, details.variants);
				return;
			}
		}
		next(null, []);
	});
}

function getBuffer(fontName, variant, next) {
	ensureLoaded(() => {
		for (let details of fontList) {
			if (details.family === fontName) {
				let url = details.files[variant];
				if (!url) return next(null);
				getUrl(url, (err, string) => {
					next(err, mime.lookup(url), string ? Buffer.from(string) : null);
				});
			}
		}
	});
}

module.exports = {
	getNameList,
	getVariants,
	getBuffer
};

"use strict";

const CardCreatr = require("card-creatr");
const store = require("../store");
const Utils = require("./utils");
const async = require("async");

function getPageSvg(/* options */) {
	var result = Utils.makePageSvg(
		store.getters.globalOptions,
		store.getters.renderer,
		store.state.cardOptions,
		true
	);
	var string = result.string;
	var numPages = result.numPages;
	var options = store.getters.globalOptions;
	var dims = Object.assign({}, options.get("/dimensions/page"));
	if (dims.unit !== "pt") {
		alert("Units of 'pt' are required for printing");
	}
	dims.unit = "px";
	// TODO: Conider dividing by window.devicePixelRatio below. In the Electron screen capture, the number of pixels gets doubled, but in Firefox, this does not happen.
	var scale = Math.round(dims.dpi / 72);
	console.log("scale: " + scale);
	var svgString = Utils.finalizeSvg(
		string,
		dims,
		options,
		false,
		numPages,
		scale
	);
	return {
		svgString,
		pageWidth: dims.width,
		pageHeight: dims.height,
		scale,
		numPages
	};
}

function getSinglePageSvgs(/* options */) {
	var strings = Utils.makePageSvg(
		store.getters.globalOptions,
		store.getters.renderer,
		store.state.cardOptions,
		false
	);
	var options = store.getters.globalOptions;
	var dims = Object.assign({}, options.get("/dimensions/page"));
	if (dims.unit !== "pt") {
		alert("Units of 'pt' are required for printing");
	}
	dims.unit = "px";
	// TODO: Conider dividing by window.devicePixelRatio below. In the Electron screen capture, the number of pixels gets doubled, but in Firefox, this does not happen.
	var scale = Math.round(dims.dpi / 72);
	console.log("scale: " + scale);
	var svgStrings = strings.map(string => Utils.finalizeSvg(
		string,
		dims,
		options,
		false,
		1,
		scale
	));
	return {
		svgStrings,
		pageWidth: dims.width,
		pageHeight: dims.height,
		scale
	};
}

function getCardSvgs(/* options */) {
	var cards = Utils.makeCardSvgs(
		store.getters.globalOptions,
		store.getters.renderer,
		store.state.cardOptions,
		false
	);
	var options = store.getters.globalOptions;
	var dims = Object.assign({}, options.get("/dimensions/card"));
	if (dims.unit !== "pt") {
		alert("Units of 'pt' are required for printing");
	}
	dims.unit = "px";
	// TODO: Conider dividing by window.devicePixelRatio below. In the Electron screen capture, the number of pixels gets doubled, but in Firefox, this does not happen.
	var scale = Math.round(dims.dpi / 72);
	console.log("scale: " + scale);
	var svgStrings = cards.map((card) => {
		return Utils.finalizeSvg(
			card,
			dims,
			options,
			false,
			1,
			scale
		);
	});
	return {
		svgStrings,
		pageWidth: dims.width,
		pageHeight: dims.height,
		scale
	};
}

function printSlimerJS(options, next) {
	var filePath = options.filePath;
	if (!filePath) return;
	try {
		let { svgString, pageWidth, pageHeight, scale, numPages } = getPageSvg(options);
		CardCreatr.rasterize.slimerjs(svgString, pageWidth, pageHeight, scale, numPages, "pdf", filePath, (err) => {
			if (err) return next(err);
			next(null);
		});
	} catch(err) {
		next(err);
	}
}

function printPageCanvasPdf(options, progress, next) {
	var filePath = options.filePath;
	if (!filePath) return;
	try {
		let { svgString, pageWidth, pageHeight, scale, numPages } = getPageSvg(options);
		CardCreatr.rasterize.canvasDrawImage(svgString, pageWidth, pageHeight, scale, numPages, progress, (err, pngBuffers) => {
			CardCreatr.rasterize.pngListToDestinationPdf(filePath, pngBuffers, pageWidth, pageHeight, next);
		});
	} catch(err) {
		next(err);
	}
}

function printPageCanvasPdf2(options, progress, next) {
	var filePath = options.filePath;
	if (!filePath) return;
	try {
		let { svgStrings, pageWidth, pageHeight, scale } = getSinglePageSvgs(options);
		CardCreatr.rasterize.canvasDrawImage2(svgStrings, pageWidth, pageHeight, scale, progress, (err, pngBuffers) => {
			if (err) return next(err);
			CardCreatr.rasterize.pngListToDestinationPdf(filePath, pngBuffers, pageWidth, pageHeight, next);
		});
	} catch(err) {
		next(err);
	}
}

function printCardCanvasZip(options, progress, next) {
	var filePath = options.filePath;
	if (!filePath) return;
	try {
		let { svgStrings, pageWidth, pageHeight, scale } = getCardSvgs(options);
		async.times(svgStrings.length, (i, _next) => {
			let svgString = svgStrings[i];
			CardCreatr.rasterize.canvasDrawImage(svgString, pageWidth, pageHeight, scale, 1, (status) => {
				status.page = i;
				progress(status);
			}, _next);
		}, (err, pngBufferses) => {
			if (err) return next(err);
			let pngBuffers = pngBufferses.map((v) => { return v[0]; });
			CardCreatr.rasterize.pngListToPngsZip(filePath, pngBuffers, pageWidth, pageHeight, next);
		});
	} catch(err) {
		next(err);
	}
}


module.exports = { getPageSvg, getCardSvgs, printSlimerJS, printPageCanvasPdf, printPageCanvasPdf2, printCardCanvasZip };

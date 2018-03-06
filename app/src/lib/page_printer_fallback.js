"use strict";

const CardCreatr = require("card-creatr");
const store = require("../store");
const Utils = require("./utils");

function getSvg(options) {
	var result = Utils.makePages(
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

function printSlimerJS(options, next) {
	var filePath = options.filePath;
	if (!filePath) return;
	let { svgString, pageWidth, pageHeight, scale, numPages } = getSvg(options);
	CardCreatr.rasterize.slimerjs(svgString, pageWidth, pageHeight, scale, numPages, "pdf", filePath, (err) => {
		if (err) return next(err);
		next(null);
	});
}

function printCanvas(options, progress, next) {
	var filePath = options.filePath;
	if (!filePath) return;
	let { svgString, pageWidth, pageHeight, scale, numPages } = getSvg(options);
	CardCreatr.rasterize.canvasDrawImage(svgString, pageWidth, pageHeight, scale, numPages, filePath, progress, (err) => {
		if (err) return next(err);
		next(null);
	});
}


module.exports = { getSvg, printSlimerJS, printCanvas };

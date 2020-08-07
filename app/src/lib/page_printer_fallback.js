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

const CardCreatr = require("card-creatr");
const store = require("../store");
const Utils = require("./utils");
const async = require("async");

function getPageSvg(/* options */) {
	var result = Utils.makePageSvg(
		store.getters.globalOptions,
		store.getters.renderer,
		store.state.cardOptions,
		{
			printFrontAndBack: store.state.printFrontAndBack,
			concatenated: true,
			showBack: store.state.showBack
		}
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
		{
			printFrontAndBack: store.state.printFrontAndBack,
			concatenated: false,
			showBack: store.state.showBack
		}
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
		{
			showBack: store.state.showBack,
			useQty: false
		}
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

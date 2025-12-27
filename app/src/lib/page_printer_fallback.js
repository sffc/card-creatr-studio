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
	let result = Utils.makePageSvg(
		store.getters.globalOptions,
		store.getters.renderer,
		store.state.cardOptions,
		{
			concatenated: true,
			showBack: store.state.showBack
		}
	);
	let {string, numPages} = result;
	let options = store.getters.globalOptions;
	let dims = Object.assign({}, options.get("/dimensions/page"));
	if (dims.unit !== "pt") {
		alert("Units of 'pt' are required for printing");
	}
	dims.unit = "px";
	// TODO: Conider dividing by window.devicePixelRatio below. In the Electron screen capture, the number of pixels gets doubled, but in Firefox, this does not happen.
	let scale = Math.round(dims.dpi / 72);
	console.log("scale:", scale);
	let svgString = Utils.finalizeSvg(
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
	let strings = Utils.makePageSvg(
		store.getters.globalOptions,
		store.getters.renderer,
		store.state.cardOptions,
		{
			concatenated: false,
			showBack: store.state.showBack
		}
	);
	let options = store.getters.globalOptions;
	let dims = Object.assign({}, options.get("/dimensions/page"));
	if (dims.unit !== "pt") {
		alert("Units of 'pt' are required for printing");
	}
	dims.unit = "px";
	// TODO: Conider dividing by window.devicePixelRatio below. In the Electron screen capture, the number of pixels gets doubled, but in Firefox, this does not happen.
	let scale = Math.round(dims.dpi / 72);
	console.log("scale:", scale);
	let svgStrings = strings.map(string => Utils.finalizeSvg(
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
	let cards = Utils.makeCardSvgs(
		store.getters.globalOptions,
		store.getters.renderer,
		store.state.cardOptions,
		{
			showBack: store.state.showBack,
			useQty: false
		}
	);
	let options = store.getters.globalOptions;
	let dims = Object.assign({}, options.get("/dimensions/card"));
	if (dims.unit !== "pt") {
		alert("Units of 'pt' are required for printing");
	}
	dims.unit = "px";
	// TODO: Conider dividing by window.devicePixelRatio below. In the Electron screen capture, the number of pixels gets doubled, but in Firefox, this does not happen.
	let scale = Math.round(dims.dpi / 72);
	console.log("scale:", scale);
	let svgStrings = cards.map((card) => Utils.finalizeSvg(
		card,
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

function printPageCanvasPdf(options, progress, next) {
	let {filePath} = options;
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
	let {filePath} = options;
	if (!filePath) return;
	try {
		let { svgStrings, pageWidth, pageHeight, scale } = getSinglePageSvgs(options);
		// eslint-disable-next-line consistent-return
		CardCreatr.rasterize.canvasDrawImage2(svgStrings, pageWidth, pageHeight, scale, progress, (err, pngBuffers) => {
			if (err) return next(err);
			CardCreatr.rasterize.pngListToDestinationPdf(filePath, pngBuffers, pageWidth, pageHeight, next);
		});
	} catch(err) {
		next(err);
	}
}

function printCardCanvasZip(options, progress, next) {
	let {filePath} = options;
	if (!filePath) return;
	try {
		let { svgStrings, pageWidth, pageHeight, scale } = getCardSvgs(options);
		async.times(svgStrings.length, (i, _next) => {
			let svgString = svgStrings[i];
			CardCreatr.rasterize.canvasDrawImage(svgString, pageWidth, pageHeight, scale, 1, (status) => {
				status.page = i;
				progress(status);
			}, _next);
		}, (err, pngBufferses) => { // eslint-disable-line consistent-return
			if (err) return next(err);
			let pngBuffers = pngBufferses.map((v) => v[0]);
			CardCreatr.rasterize.pngListToPngsZip(filePath, pngBuffers, pageWidth, pageHeight, next);
		});
	} catch(err) {
		next(err);
	}
}


module.exports = { getPageSvg, getCardSvgs, printPageCanvasPdf, printPageCanvasPdf2, printCardCanvasZip };

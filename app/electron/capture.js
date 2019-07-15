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

const async = require("async");
const electron = require("electron");
const fs = require("fs");
const tmp = require("tmp");
const url = require("url");
const rasterize = require("card-creatr/lib/rasterize");

function renderAndSavePdf(pdfPath, options, next) {
	var svgString = options.svgString;
	var pageWidth = options.pageWidth;
	var pageHeight = options.pageHeight;
	var scale = options.scale;
	var numPages = options.numPages;
	createWindowFromString(svgString, pageWidth*scale, pageHeight*scale*numPages, (err, window, cleanupCallback) => {
		if (err) return cleanupCallback() && next(err);
		async.times(numPages, (i, _next) => {
			var rectangle = {
				x: 0,
				y: pageHeight*scale*i,
				width: pageWidth*scale,
				height: pageHeight*scale
			};
			console.log("Capturing page", rectangle);
			window.capturePage(rectangle, (nativeImage) => {
				var outputSize = nativeImage.getSize();
				console.log("Captured page", outputSize);
				_next(null, nativeImage.toPNG());
			});
		}, (err, pngBuffers) => {
			if (err) return cleanupCallback() && next(err);
			var writeStream = fs.createWriteStream(pdfPath);
			writeStream.on("finish", () => {
				cleanupCallback();
				next(null);
			});
			rasterize.pngListToPdfStream(writeStream, pngBuffers, pageWidth, pageHeight);
		});
	});
}

/*
function scrollWindow(window, dx, dy) {
	console.log("scrolling:", dx, dy);
	window.webContents.sendInputEvent({
		type: "mouseWheel",
		x: 0,
		y: 0,
		deltaX: -dx,
		deltaY: -dy,
		canScroll: true
	});
}

const WINDOW_SIZE = 200;

// The following function scrolls the page through WINDOW_SIZExWINDOW_SIZE blocks in order to capture the full area.  This workaround is necessary due to https://github.com/electron/electron/issues/8314
function capturePageMosaic(window, n, pageWidth, pageHeight, scale, next) {
	var maxI = Math.ceil(pageWidth*scale / WINDOW_SIZE);
	var maxJ = Math.ceil(pageHeight*scale / WINDOW_SIZE);
	var p = 0;
	// Scroll to the top corner of the page
	scrollWindow(window, 0, 100);
	async.whilst(() => {
		return p < maxI * maxJ;
	}, (_next) => {
		var rectangle = {
			x: 0,
			y: 0,
			width: WINDOW_SIZE,
			height: WINDOW_SIZE
		};
		console.log("Capturing page", n, rectangle);
		window.webContents.capturePage(rectangle, (img) => {
			console.log("Captured mosaic", p, img.getSize());
			fs.writeFileSync("p"+p+".png", img.toPNG());
			p++;
			setTimeout(() => {
				if ((p%maxI) === 0) {
					console.log("scroll case 1");
					scrollWindow(window, -WINDOW_SIZE*(maxI-1), WINDOW_SIZE);
				} else {
					console.log("scroll case 2");
					scrollWindow(window, WINDOW_SIZE, 0);
				}
				_next();
			}, 500);
		});
	}, (err) => {
		next(err);
	});
}
*/

function createWindowFromString(svgString, windowWidth, windowHeight, next) {
	var tmpPath, fd, cleanupCallback, window;
	async.waterfall([
		(_next) => {
			tmp.file({ postfix: ".svg", detachDescriptor: true }, _next);
		},
		(_tmpPath, _fd, _cleanupCallback, _next) => {
			tmpPath = _tmpPath;
			fd = _fd;
			cleanupCallback = _cleanupCallback;
			fs.write(fd, svgString, 0, "utf-8", _next);
		},
		(_bytesWritten, _str, _next) => {
			console.log("Bytes written to temp file:", _bytesWritten, tmpPath);
			fs.close(fd, _next);
		},
		(_next) => {
			window = new (electron.BrowserWindow)({
				width: windowWidth,
				height: windowHeight,
				useContentSize: true,
				backgroundColor: "#FFF",
				show: false
			});
			var _url = url.format({
				pathname: tmpPath,
				protocol: "file:",
				slashes: true
			});
			console.log(_url);
			window.loadURL(_url);
			window.once("ready-to-show", () => { _next(null); });
		},
		(_next) => {
			// window.show();
			// We have to use a timeout here to let the page finish rendering; see https://github.com/electron/electron/issues/6426
			setTimeout(_next, 500);
		}
	], (err) => {
		let _realCleanup = () => {
			window.close();
			cleanupCallback();
			return true;
		};
		if (err) {
			_realCleanup();
			return next(err);
		}
		next(null, window, _realCleanup);
	});
}

module.exports = { renderAndSavePdf };

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

const electron = require("electron");
const capture = require("./capture");
const CustomMenu = require("./menu");
const CustomWindowManager = require("./window").CustomWindowManager;
const http = require("http");
const shell = require("electron").shell;

const menu = new CustomMenu();

// Global reference, which keeps windows from being garbage collected.
global.windowManager = new CustomWindowManager();

function showOpenDialog(next) {
	electron.dialog.showOpenDialog({
		properties: [ "openFile", "createDirectory" ],
		filters: [
			{name: "Card Creatr Studio Files", extensions: ["ccsb", "ccst"]},
			{name: "All Files", extensions: ["*"]}
		]
	}).then(({ filePaths }) => {
		if (!filePaths) return next(null);
		next(filePaths[0]);
	});
}

menu.on("new", () => {
	global.windowManager.create(null);
});

menu.on("open", () => {
	showOpenDialog(global.openFile);
});

menu.on("save", (browserWindow) => {
	let window = global.windowManager.getByBrowserWindow(browserWindow);
	window.saveOrSaveAs();
});

menu.on("saveas", (browserWindow) => {
	let window = global.windowManager.getByBrowserWindow(browserWindow);
	window.saveAs();
});

menu.on("printhelp", (/* browserWindow */) => {
	electron.dialog.showMessageBox({
		type: "info",
		message: "Print and Export Options",
		detail: "Card Creatr Studio gives four options for exporting your cards as a printable PDF file in order to work around numerous known bugs in the underlying rendering engines.\n\n1) The default \"Export to PDF\" uses HTML5 Canvas to render the PDF. This is the best option for almost all users.\n\n2) \"Print with Electron\" uses Electron's own printing engine. This has a number of bugs from upstream Chromium that cause image cropping and masking to not work.\n\n3) \"Export to PDF with Firefox\" spawns an instance of Firefox in the background and uses Firefox's rendering engine. This is a viable alternative if you encounter a bug in Chromium's SVG renderer.\n\n4) \"Export to PDF with Electron\" uses Electron's screen capture functionality. This should be attempted only if the other options do not work for you.\n\n5) \"Export to PDF with Canvas v1\" is the same as the default \"Export to PDF\" except that it renders all pages from a single snapshot. This can be attempted if the other options are not successful."
	});
});

menu.on("print", (browserWindow) => {
	let window = global.windowManager.getByBrowserWindow(browserWindow);
	window.print();
});

menu.on("print2", (browserWindow) => {
	electron.dialog.showSaveDialog(browserWindow, {
		defaultPath: "print.pdf",
		filters: [
			{name: "PDF File", extensions: ["pdf"]}
		]
	}).then(({ filePath }) => {
		if (!filePath) return;
		let window = global.windowManager.getByBrowserWindow(browserWindow);
		console.log("Requesting SVG...");
		window.getSvg({}, (response) => {
			capture.renderAndSavePdf(filePath, response, (err) => {
				electron.dialog.showMessageBox({
					type: (err ? "warning" : "info"),
					message: "Export using Blink",
					detail: (err ? err.toString() : "The export is complete.")
				});
			});
		});
	});
});

menu.on("print4", (browserWindow) => {
	electron.dialog.showSaveDialog(browserWindow, {
		defaultPath: "print.pdf",
		filters: [
			{name: "PDF File", extensions: ["pdf"]}
		]
	}).then(({ filePath }) => {
		if (!filePath) return;
		let window = global.windowManager.getByBrowserWindow(browserWindow);
		window.print3({ filePath });
	});
});

menu.on("print5", (browserWindow) => {
	electron.dialog.showSaveDialog(browserWindow, {
		defaultPath: "print.pdf",
		filters: [
			{name: "PDF File", extensions: ["pdf"]}
		]
	}).then(({ filePath }) => {
		if (!filePath) return;
		let window = global.windowManager.getByBrowserWindow(browserWindow);
		window.print4({ filePath });
	});
});

menu.on("cardImages1", (browserWindow) => {
	electron.dialog.showSaveDialog(browserWindow, {
		defaultPath: "cards.zip",
		filters: [
			{name: "Zip File", extensions: ["zip"]}
		]
	}).then(({ filePath }) => {
		if (!filePath) return;
		let window = global.windowManager.getByBrowserWindow(browserWindow);
		window.cardImages1({ filePath });
	});
});

menu.on("addcard", (browserWindow) => {
	let window = global.windowManager.getByBrowserWindow(browserWindow);
	window.addCard();
});

menu.on("movecardup", (browserWindow) => {
	let window = global.windowManager.getByBrowserWindow(browserWindow);
	window.moveCardUp();
});

menu.on("movecarddown", (browserWindow) => {
	let window = global.windowManager.getByBrowserWindow(browserWindow);
	window.moveCardDown();
});

menu.on("deletecard", (browserWindow) => {
	let window = global.windowManager.getByBrowserWindow(browserWindow);
	window.deleteCard();
});

menu.on("toggleGrid", (browserWindow) => {
	let window = global.windowManager.getByBrowserWindow(browserWindow);
	window.toggleGrid();
});

menu.on("viewSvgXml", (browserWindow) => {
	let window = global.windowManager.getByBrowserWindow(browserWindow);
	window.viewSvgXml();
});

menu.on("checkForUpdates", (/* browserWindow */) => {
	http.get("http://cardcreatr.shane.guru/versions/latest.txt", (res) => {
		let currentVersion = require("../package.json").version;
		let latestVersion = "";
		res.on("data", function(chunk) {
			latestVersion += chunk;
		});
		res.on("end", function() {
			if (currentVersion !== latestVersion) {
				electron.dialog.showMessageBox({
					type: "info",
					message: "Updates Available",
					detail: "Your version: " + currentVersion + "\nLatest version: " + latestVersion,
					buttons: ["Download", "Cancel"],
					defaultId: 0,
					cancelId: 1
				}).then(({ response }) => {
					if (response === 0) {
						shell.openExternal("http://cardcreatr.shane.guru/latestdist/");
					}
				});
			} else {
				electron.dialog.showMessageBox({
					type: "info",
					message: "All Up-to-Date!",
					detail: "Version: " + currentVersion,
					buttons: ["OK", "Download Page"],
					defaultId: 0,
					cancelId: 1
				}).then(({ response }) => {
					if (response === 1) {
						shell.openExternal("http://cardcreatr.shane.guru/latestdist/");
					}
				});
			}
		});
	}).on("error", (err) => {
		electron.dialog.showMessageBox({
			type: "warning",
			message: "Internet Connection Required",
			detail: "Could not connect to cardcreatr.shane.guru: " + err
		});
	});
});

// Quit when all windows are closed.
electron.app.on("window-all-closed", () => {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== "darwin") {
		electron.app.quit();
	}
});

const filesToOpen = [];
function openFile1(filePath) {
	// Before app is ready
	filesToOpen.push(filePath);
}
function openFile2(filePath) {
	// After app is ready
	if (!filePath) return;
	let window = global.windowManager.getByPath(filePath);
	if (window) {
		window.browserWindow.focus();
	} else {
		global.windowManager.create(filePath);
	}
}
global.openFile = openFile1;

electron.app.on("open-file", (event, filePath) => {
	console.log("Opening file:", filePath);
	global.openFile(filePath);
});

// Populate filesToOpen on non-Mac OS
if (process.platform !== "darwin") {
	filesToOpen.push(process.argv[1]);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
electron.app.on("ready", () => {
	global.openFile = openFile2;
	for (let filePath of filesToOpen) {
		global.openFile(filePath);
	}
	electron.Menu.setApplicationMenu(menu.getMenuInstance());
	if (global.windowManager.count() === 0) {
		showOpenDialog(global.openFile);
	}
	try {
		const edi = require("electron-devtools-installer");
		edi.default(edi.VUEJS_DEVTOOLS)
			.then((name) => console.log(`Added Extension:  ${name}`))
			.catch((err) => console.log("EDI Error 1: ", err));
	} catch(err) {
		console.log("EDI Error 2:", err);
	}
});

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

/* eslint max-classes-per-file: "off" */

// A class running in the main thread representing a window object.

const electron = require("electron");
const EventEmitter = require("events");
const path = require("path");
const url = require("url");

let globalCounter = 0;

class CustomWindow extends EventEmitter {
	constructor(filePath) {
		super();
		this.id = globalCounter++;
		this.isDirty = false;
		this.browserWindow = new (electron.BrowserWindow)({
			width: 800,
			height: 600,
			useContentSize: true,
			backgroundColor: "#666", // gutter color
			webPreferences: {
				nativeWindowOpen: true,  // allows window.document after window.open()
				// https://stackoverflow.com/a/55908510/1407170
				nodeIntegration: true,
				contextIsolation: false,
			}
		});
		this._addListeners();
		this._setPath(filePath);
		this._reload();
		console.log(`Created window ${this.id} for path ${filePath}`);
	}

	saveAs(next) {
		electron.dialog.showSaveDialog(this.browserWindow, {
			filters: [
				{name: "Card Creatr Studio Template", extensions: ["ccst"]},
				{name: "Card Creatr Studio Bundle", extensions: ["ccsb"]}
			]
		}).then(({ filePath }) => {
			if (!filePath) return;
			this._setPath(filePath);
			this._save(next);
		});
	}

	saveOrSaveAs(next) {
		// If a ccst file is open, do not overwrite it by default.
		if (this.path && !/\.ccst$/u.test(this.path)) {
			this._save(next);
		} else {
			this.saveAs(next);
		}
	}

	print3(options) {
		this._sendMessage("print3", options);
	}

	print4(options) {
		this._sendMessage("print4", options);
	}

	cardImages1(options) {
		this._sendMessage("cardImages1", options);
	}

	getSvg(options, next) {
		this._sendAndReceive("getsvg", options, next);
	}

	addCard() {
		this._sendMessage("addcard", {});
	}

	moveCardUp() {
		this._sendMessage("movecardup", {});
	}

	moveCardDown() {
		this._sendMessage("movecarddown", {});
	}

	deleteCard() {
		this._sendMessage("deletecard", {});
	}

	toggleGrid() {
		this._sendMessage("toggleGrid", {});
	}

	viewSvgXml() {
		this._sendMessage("viewSvgXml", {});
	}

	_addListeners() {
		console.log(`Adding listeners for window ${this.id}`);
		this._onClose$bound = this._onClose.bind(this);
		this._onClosed$bound = this._onClosed.bind(this);
		this._onSAR$bound = this._onSAR.bind(this);
		this._onDirty$bound = this._onDirty.bind(this);
		this._onShowMessageBox$bound = this._onShowMessageBox.bind(this);
		this.browserWindow.on("close", this._onClose$bound);
		this.browserWindow.on("closed", this._onClosed$bound);
		electron.ipcMain.on("_SAR", this._onSAR$bound);
		electron.ipcMain.on("dirty", this._onDirty$bound);
		electron.ipcMain.on("showMessageBox", this._onShowMessageBox$bound);
	}

	_removeListeners() {
		console.log(`Removing listeners for window ${this.id}`);
		this.browserWindow.removeListener("close", this._onClose$bound);
		this.browserWindow.removeListener("closed", this._onClosed$bound);
		electron.ipcMain.removeListener("_SAR", this._onSAR$bound);
		electron.ipcMain.removeListener("dirty", this._onDirty$bound);
		electron.ipcMain.removeListener("showMessageBox", this._onShowMessageBox$bound);
	}

	/** This method assumes that a file path is present. Should not be called directly; use #saveOrSaveAs() instead. */
	_save(next) {
		this._sendAndReceive("save", {}, (response) => {
			if (next) next(response);
		});
	}

	_setPath(filePath) {
		this.path = filePath;
		if (filePath) {
			this.browserWindow.setRepresentedFilename(filePath);
		}
		this._updateTitle();
		this._sendMessage("path", { path: filePath });
	}

	_updateTitle() {
		this.browserWindow.setDocumentEdited(this.isDirty);
		if (this.isDirty) {
			this.browserWindow.setTitle(`${this._basename()}* — Card Creatr`);
		} else {
			this.browserWindow.setTitle(`${this._basename()} — Card Creatr`);
		}
	}

	_basename() {
		if (this.path) {
			return path.basename(this.path);
		} else {
			return "New File";
		}
	}

	_reload() {
		// var port = process.env.PORT || appConfig.dev.port;
		let _url = url.format({
			pathname: path.join(__dirname, "..", "electron", "index.html"),
			protocol: "file:",
			// pathname: "/",
			// protocol: "http:",
			// hostname: "localhost",
			// port: port,
			slashes: true,
			query: {
				path: this.path
			}
		});
		console.log(_url);
		this.browserWindow.loadURL(_url);
	}

	_onClose(event) {
		// Ask the user to save file if they made edits
		if (this.isDirty) {
			event.preventDefault();
			electron.dialog.showMessageBox({
				type: "info",
				title: "Save changes?",
				message: `Do you want to save the changes you made to ${this._basename()}?`,
				detail: "Your changes will be lost if you don't save them.",
				buttons: ["Save", "Discard", "Cancel"],
				defaultId: 0
			}).then(({ response }) => {
				if (response === 0) {
					this.saveOrSaveAs(() => {
						this.browserWindow.destroy();
					});
				} else if (response === 1) {
					this.browserWindow.destroy();
				} else {
					// Do nothing
				}
			});
		} else {
			// Let the window close as usual
		}
	}

	_onClosed(/* event */) {
		this._removeListeners();
		this.emit("closed", { window: this });
	}

	_onDirty(event, message) {
		if (event.sender === this.browserWindow.webContents) {
			console.log(`Dirty event for window ${this.id}`, message);
			this.isDirty = message.isDirty;
			this._updateTitle();
		}
	}

	_onSAR(event, message) {
		if (event.sender === this.browserWindow.webContents) {
			this.emit("_SAR", message);
		}
	}

	_onShowMessageBox(event, message) {
		if (event.sender === this.browserWindow.webContents) {
			electron.dialog.showMessageBox(message);
		}
	}

	_sendMessage(name, message) {
		this.browserWindow.webContents.send(name, message);
	}

	_sendAndReceive(name, message, next) {
		let id = globalCounter++;
		let _next = (data) => {
			if (data.id === id) {
				this.removeListener("_SAR", _next);
				next(data.response);
			}
		};
		this.on("_SAR", _next);
		this.browserWindow.webContents.send("_SAR", { id, name, message });
	}
}

class CustomWindowManager {
	constructor() {
		this.windows = [];
		this._onClosed$bound = this._onClosed.bind(this);
	}

	create(filePath) {
		let window = new CustomWindow(filePath);
		window.on("closed", this._onClosed$bound);
		this.windows.push(window);
		return window;
	}

	getByBrowserWindow(browserWindow) {
		for (let window of this.windows) {
			if (window.browserWindow === browserWindow) {
				return window;
			}
		}
		return null;
	}

	getByPath(filePath) {
		for (let window of this.windows) {
			if (window.path === filePath) {
				return window;
			}
		}
		return null;
	}

	count() {
		return this.windows.length;
	}

	_onClosed(message) {
		let idx = this.windows.indexOf(message.window);
		let window = this.windows[idx];
		window.removeListener("closed", this._onClosed$bound);
		this.windows.splice(idx, 1);
	}
}

module.exports = { CustomWindow, CustomWindowManager };

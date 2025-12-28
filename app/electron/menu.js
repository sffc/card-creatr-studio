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

// This template is from https://github.com/electron/electron/blob/master/docs/api/menu.md
// I don't like having it hard-coded like this.  I would rather use a reputable library implementation, which does not exist as far as I can tell.

const electron = require("electron");
const EventEmitter = require("events");

// getTemplate() is a function so that it returns a fresh copy of the template, rather than returning a global copy, which might be modified.
function getTemplate() {
	let template = [
		{
			label: "Edit",
			submenu: [
				{
					role: "undo"
				},
				{
					role: "redo"
				},
				{
					type: "separator"
				},
				{
					role: "cut"
				},
				{
					role: "copy"
				},
				{
					role: "paste"
				},
				{
					role: "pasteandmatchstyle"
				},
				{
					role: "delete"
				},
				{
					role: "selectall"
				},
			]
		},
		{
			label: "View",
			submenu: [
				{
					role: "resetzoom"
				},
				{
					role: "zoomin"
				},
				{
					role: "zoomout"
				},
				{
					type: "separator"
				},
				{
					role: "togglefullscreen"
				},
				{
					type: "separator"
				},
				{
					label: "Developer Tools (Advanced)",
					accelerator: process.platform === "darwin" ? "Alt+Command+I" : "Ctrl+Shift+I",
					click (item, focusedWindow) {
						if (focusedWindow) focusedWindow.webContents.toggleDevTools();
					}
				}
			]
		},
		{
			role: "window",
			submenu: [
				{
					role: "minimize"
				},
				{
					role: "close"
				}
			]
		},
		{
			role: "help",
			submenu: [
			]
		}
	];

	if (process.platform === "darwin") {
		template.unshift({
			label: electron.app.getName(),
			submenu: [
				{
					role: "about"
				},
				{
					type: "separator"
				},
				{
					role: "services",
					submenu: []
				},
				{
					type: "separator"
				},
				{
					role: "hide"
				},
				{
					role: "hideothers"
				},
				{
					role: "unhide"
				},
				{
					type: "separator"
				},
				{
					role: "quit"
				}
			]
		});
		// Edit menu.
		template[1].submenu.push(
			{
				type: "separator"
			},
			{
				label: "Speech",
				submenu: [
					{
						role: "startspeaking"
					},
					{
						role: "stopspeaking"
					}
				]
			}
		);
		// Window menu.
		template[3].submenu = [
			{
				label: "Close",
				accelerator: "CmdOrCtrl+W",
				role: "close"
			},
			{
				label: "Minimize",
				accelerator: "CmdOrCtrl+M",
				role: "minimize"
			},
			{
				label: "Zoom",
				role: "zoom"
			},
			{
				type: "separator"
			},
			{
				label: "Bring All to Front",
				role: "front"
			}
		];
	}

	return template;
}


class CustomMenu extends EventEmitter {
	constructor() {
		super();
		let fileMenu = {
			label: "File",
			submenu: [
				{
					label: "New Empty File",
					accelerator: "CmdOrCtrl+N",
					click: (item, focusedWindow) => {
						this.emit("new", focusedWindow);
					}
				},
				{
					label: "Open…",
					accelerator: "CmdOrCtrl+O",
					click: (item, focusedWindow) => {
						this.emit("open", focusedWindow);
					}
				},
				{
					label: "Save",
					accelerator: "CmdOrCtrl+S",
					click: (item, focusedWindow) => {
						this.emit("save", focusedWindow);
					}
				},
				{
					label: "Save As…",
					accelerator: "CmdOrCtrl+Shift+S",
					click: (item, focusedWindow) => {
						this.emit("saveas", focusedWindow);
					}
				},
				{
					type: "separator"
				},
				{
					id: "printFrontBack",
					label: "Print front and back in one document",
					type: "checkbox",
					click: (item, focusedWindow) => {
						this.emit("printfrontback", focusedWindow, item.checked);
					}
				},
				{
					label: "Export to PDF…",
					accelerator: "CmdOrCtrl+Alt+E",
					click: (item, focusedWindow) => {
						this.emit("print5", focusedWindow);
					}
				},
				{
					type: "separator"
				},
				{
					label: "Export Card Images…",
					accelerator: "CmdOrCtrl+Shift+E",
					click: (item, focusedWindow) => {
						this.emit("cardImages1", focusedWindow);
					}
				},
				{
					type: "separator"
				},
				{
					label: "Advanced",
					submenu: [
						{
							label: "Read About Print/Export Options",
							click: (item, focusedWindow) => {
								this.emit("printhelp", focusedWindow);
							}
						},
						{
							type: "separator"
						},
						{
							label: "Export to PDF with Electron…",
							click: (item, focusedWindow) => {
								this.emit("print2", focusedWindow);
							}
						},
						{
							label: "Export to PDF with Canvas v1…",
							click: (item, focusedWindow) => {
								this.emit("print4", focusedWindow);
							}
						}
					]
				}
			]
		};

		this.template = getTemplate();

		let editMenu, helpMenu, viewMenu;
		if (process.platform === "darwin") {
			this.template.splice(1, 0, fileMenu);
			editMenu = this.template[2];
			viewMenu = this.template[3];
			helpMenu = this.template[5];
		} else {
			this.template.splice(0, 0, fileMenu);
			editMenu = this.template[1];
			viewMenu = this.template[2];
			helpMenu = this.template[4];
		}

		editMenu.submenu.push(
			{
				type: "separator"
			},
			{
				label: "Add Card",
				accelerator: "CmdOrCtrl+Shift+N",
				click: (item, focusedWindow) => {
					this.emit("addcard", focusedWindow);
				}
			},
			{
				label: "Copy Card",
				accelerator: "CmdOrCtrl+Shift+C",
				click: (item, focusedWindow) => {
					this.emit("copycard", focusedWindow);
				}
			},
			{
				label: "Move Card Up",
				accelerator: "CmdOrCtrl+Alt+Up",
				click: (item, focusedWindow) => {
					this.emit("movecardup", focusedWindow);
				}
			},
			{
				label: "Move Card Down",
				accelerator: "CmdOrCtrl+Alt+Down",
				click: (item, focusedWindow) => {
					this.emit("movecarddown", focusedWindow);
				}
			},
			{
				label: "Delete Current Card…",
				accelerator: "CmdOrCtrl+Backspace",
				click: (item, focusedWindow) => {
					this.emit("deletecard", focusedWindow);
				}
			}
		);

		viewMenu.submenu.push(
			{
				type: "separator"
			},
			{
				label: "Show/Hide Grid",
				accelerator: "CmdOrCtrl+Alt+G",
				click: (item, focusedWindow) => {
					this.emit("toggleGrid", focusedWindow);
				}
			},
			{
				label: "View SVG XML",
				click: (item, focusedWindow) => {
					this.emit("viewSvgXml", focusedWindow);
				}
			}
		);

		helpMenu.submenu.push(
			{
				label: "Check for Updates…",
				click: (item, focusedWindow) => {
					this.emit("checkForUpdates", focusedWindow);
				}
			}
		);
	}

	getMenuInstance() {
		return electron.Menu.buildFromTemplate(this.template);
	}
}

module.exports = CustomMenu;

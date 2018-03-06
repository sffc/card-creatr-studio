"use strict";

// This template is from https://github.com/electron/electron/blob/master/docs/api/menu.md
// I don't like having it hard-coded like this.  I would rather use a reputable library implementation, which does not exist as far as I can tell.

const electron = require("electron");
const EventEmitter = require("events");

// getTemplate() is a function so that it returns a fresh copy of the template, rather than returning a global copy, which might be modified.
function getTemplate() {
	let template = [
		{
			label: 'Edit',
			submenu: [
				{
					role: 'undo'
				},
				{
					role: 'redo'
				},
				{
					type: 'separator'
				},
				{
					role: 'cut'
				},
				{
					role: 'copy'
				},
				{
					role: 'paste'
				},
				{
					role: 'pasteandmatchstyle'
				},
				{
					role: 'delete'
				},
				{
					role: 'selectall'
				},
			]
		},
		{
			label: 'View',
			submenu: [
				{
					role: 'resetzoom'
				},
				{
					role: 'zoomin'
				},
				{
					role: 'zoomout'
				},
				{
					type: 'separator'
				},
				{
					role: 'togglefullscreen'
				},
				{
					type: 'separator'
				},
				{
					label: 'Developer Tools (Advanced)',
					accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
					click (item, focusedWindow) {
						if (focusedWindow) focusedWindow.webContents.toggleDevTools()
					}
				}
			]
		},
		{
			role: 'window',
			submenu: [
				{
					role: 'minimize'
				},
				{
					role: 'close'
				}
			]
		},
		{
			role: 'help',
			submenu: [
				{
					label: 'Learn More',
					click () { require('electron').shell.openExternal('http://electron.atom.io') }
				}
			]
		}
	]

	if (process.platform === 'darwin') {
		template.unshift({
			label: electron.app.getName(),
			submenu: [
				{
					role: 'about'
				},
				{
					type: 'separator'
				},
				{
					role: 'services',
					submenu: []
				},
				{
					type: 'separator'
				},
				{
					role: 'hide'
				},
				{
					role: 'hideothers'
				},
				{
					role: 'unhide'
				},
				{
					type: 'separator'
				},
				{
					role: 'quit'
				}
			]
		})
		// Edit menu.
		template[1].submenu.push(
			{
				type: 'separator'
			},
			{
				label: 'Speech',
				submenu: [
					{
						role: 'startspeaking'
					},
					{
						role: 'stopspeaking'
					}
				]
			}
		)
		// Window menu.
		template[3].submenu = [
			{
				label: 'Close',
				accelerator: 'CmdOrCtrl+W',
				role: 'close'
			},
			{
				label: 'Minimize',
				accelerator: 'CmdOrCtrl+M',
				role: 'minimize'
			},
			{
				label: 'Zoom',
				role: 'zoom'
			},
			{
				type: 'separator'
			},
			{
				label: 'Bring All to Front',
				role: 'front'
			}
		]
	};

	return template
}


class CustomMenu extends EventEmitter {
	constructor() {
		super();
		let fileMenu = {
			label: "File",
			submenu: [
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
					label: "Export to PDF…",
					accelerator: "CmdOrCtrl+Alt+E",
					click: (item, focusedWindow) => {
						this.emit("print4", focusedWindow);
					}
				},
				{
					type: "separator"
				},
				{
					label: "Advanced",
					submenu: [
						{
							label: "New Empty File",
							click: (item, focusedWindow) => {
								this.emit("new", focusedWindow);
							}
						},
						{
							type: "separator"
						},
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
							label: "Print with Electron…",
							click: (item, focusedWindow) => {
								this.emit("print", focusedWindow);
							}
						},
						{
							label: "Export to PDF with Firefox…",
							click: (item, focusedWindow) => {
								this.emit("print3", focusedWindow);
							}
						},
						{
							label: "Export to PDF with Electron…",
							click: (item, focusedWindow) => {
								this.emit("print2", focusedWindow);
							}
						}
					]
				}
			]
		};

		this.template = getTemplate();

		var editMenu, viewMenu;
		if (process.platform === "darwin") {
			this.template.splice(1, 0, fileMenu);
			editMenu = this.template[2];
			viewMenu = this.template[3];
		} else {
			this.template.splice(0, 0, fileMenu);
			editMenu = this.template[1];
			viewMenu = this.template[2];
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
				label: "Delete Current Card…",
				accelerator: "CmdOrCtrl+Backspace",
				click: (item, focusedWindow) => {
					this.emit("deletecard", focusedWindow);
				}
			}
		);

		viewMenu.submenu.push(
			{
				type: 'separator'
			},
			{
				label: "Show/Hide Grid",
				accelerator: "CmdOrCtrl+Alt+G",
				click: (item, focusedWindow) => {
					this.emit("toggleGrid", focusedWindow);
				}
			},
		);
	}

	getMenuInstance() {
		return electron.Menu.buildFromTemplate(this.template);
	}
}

module.exports = CustomMenu;

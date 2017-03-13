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
				}
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
					label: "New File",
					accelerator: "CmdOrCtrl+N",
					click: (item, focusedWindow) => {
						this.emit("new", focusedWindow);
					}
				},
				// {
				// 	label: "New from Template…",
				// 	accelerator: "CmdOrCtrl+Shift+N",
				// 	click: (item, focusedWindow) => {
				// 		this.emit("newfromtemplate", focusedWindow);
				// 	}
				// },
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
					label: "Print…",
					accelerator: "CmdOrCtrl+P",
					click: (item, focusedWindow) => {
						this.emit("print", focusedWindow);
					}
				},
				// {
				// 	label: "Export to PDF…",
				// 	accelerator: "CmdOrCtrl+Shift+E",
				// 	click: (item, focusedWindow) => {
				// 		this.emit("exporttopdf", focusedWindow);
				// 	}
				// }
			]
		};

		this.template = getTemplate();
		this.template.splice(1, 0, fileMenu);
	}

	getMenuInstance() {
		return electron.Menu.buildFromTemplate(this.template);
	}
}

module.exports = CustomMenu;

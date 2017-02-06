"use strict";

const electron = require("electron");
const CustomMenu = require("./menu");
const CustomWindowManager = require("./window").CustomWindowManager;


const menu = new CustomMenu();

// Global reference, which keeps windows from being garbage collected.
global.windowManager = new CustomWindowManager();

function showOpenDialog(next) {
	electron.dialog.showOpenDialog({
		properties: [ "openFile", "createDirectory" ],
		filters: [
			{name: "Card Creatr Studio Bundle Files", extensions: ["ccsb"]},
			{name: "All Files", extensions: ["*"]}
		]
	}, (filePaths) => {
		if (!filePaths) return next(null);
		next(filePaths[0]);
	});
}

function openFile() {
}

menu.on("new", () => {
	global.windowManager.create(null);
});

menu.on("open", () => {
	showOpenDialog((filePath) => {
		if (!filePath) return;
		let window = global.windowManager.getByPath(filePath);
		if (window) {
			window.browserWindow.focus();
		} else {
			global.windowManager.create(filePath);
		}
	});
});

menu.on("save", (browserWindow) => {
	let window = global.windowManager.getByBrowserWindow(browserWindow);
	window.saveOrSaveAs();
});

menu.on("saveas", (browserWindow) => {
	let window = global.windowManager.getByBrowserWindow(browserWindow);
	window.saveAs();
});

menu.on("print", (browserWindow) => {
	let window = global.windowManager.getByBrowserWindow(browserWindow);
	window.print();
});

// Quit when all windows are closed.
electron.app.on("window-all-closed", function () {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== "darwin") {
		electron.app.quit()
	}
});


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
electron.app.on("ready", () => {
	electron.Menu.setApplicationMenu(menu.getMenuInstance());
	showOpenDialog((filePath) => {
		if (!filePath) return;
		global.windowManager.create(filePath);
	});
});

"use strict";

const child_process = require("child_process");
const path = require("path");

const devServer = child_process.fork("build/dev-server", {
	env: Object.assign({}, process.env, {
		ELECTRON: true
	})
});
const electron = child_process.spawn("node_modules/.bin/electron", ["."], {
	stdio: "inherit",
	cwd: path.join(__dirname, "..")
});

function end() {
	console.log("=== RECEIVED SIGNAL. TERMINATING ===");
	devServer.kill("SIGTERM");
	electron.kill("SIGTERM");
}

process.on("SIGINT", end);
process.on("SIGTERM", end);

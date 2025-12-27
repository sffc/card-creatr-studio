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

const pd = require("pretty-data").pd;
const entities = new (require("html-entities").XmlEntities)();

let svgXmlWindow = null;

function open(rawSvgXml) {
	if (!rawSvgXml) {
		alert("Please select a card and make sure that the preview pane is open.");
		return;
	}

	if (!svgXmlWindow || svgXmlWindow.closed) {
		svgXmlWindow = window.open("", "SvgXmlPreview", "width=300,resizeable,scrollbars");
		svgXmlWindow.document.write("<style>body{ background-color:#FFF; font-family:monospace; font-size:1.2em; white-space:pre-wrap; }</style><body></body>");
		svgXmlWindow.document.title = "SVG XML Viewer";
	}

	update(rawSvgXml); // eslint-disable-line no-use-before-define
}

function update(rawSvgXml) {
	if (!svgXmlWindow || svgXmlWindow.closed) {
		return;
	}

	let cleanSvgXml = rawSvgXml || "{{ no current SVG }}";

	// Shorten data URIs
	cleanSvgXml = cleanSvgXml.replace(/data:.*?;base64,[\w/+=]*/ug, "…");

	// Pretty-print
	cleanSvgXml = pd.xml(cleanSvgXml);

	// HTML escape
	cleanSvgXml = entities.encode(cleanSvgXml);

	// Display
	svgXmlWindow.document.body.innerHTML = cleanSvgXml;
}

module.exports = {
	open,
	update
};

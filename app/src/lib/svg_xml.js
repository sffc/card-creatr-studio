"use strict";

const pd = require("pretty-data").pd;
const entities = new (require("html-entities").XmlEntities)();

var svgXmlWindow = null;

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

	update(rawSvgXml);
}

function update(rawSvgXml) {
	if (!svgXmlWindow || svgXmlWindow.closed) {
		return;
	}

	let cleanSvgXml = rawSvgXml || "{{ no current SVG }}";

	// Shorten data URIs
	cleanSvgXml = cleanSvgXml.replace(/data:.*?;base64,[\w\/\+\=]*/g, "…");

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

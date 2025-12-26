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

// This file is an unfinished attempt at making a GUI to construct a template, instead of requiring the user to write Pug code.

var editorTemplate = `
<div>
	<template-element v-for="element in elements" :element="element"></template-element>
</div>
`;

var elementTemplate = `
<div>
	{{ element.toString() }}
</div>
`;

//<script>
const Vue = require("@vue/compat");
const pugLexer = require("pug-lexer");
const pugParser = require("pug-parser");

const ElementTypes = {
	CODE: "code",
	RECT: "rect",
	TEXT: "text",
	TEXT_WRAP: "textWrap",
};

class Element {
	constructor(type, options) {
		this.type = type;
		this.options = options;
	}

	toString() {
		let realOptions = Object.assign({}, this.options);
		delete realOptions.node;
		return "<Element " + this.type + " " + JSON.stringify(realOptions) + ">";
	}
}

function getAttr(node, key, type) {
	let attrs = node.attrs || [];
	for (let attr of attrs) {
		if (attr.name === key) {
			let value = attr.val;
			if (type === "float") {
				return parseFloat(value);
			} else if (type === "string") {
				value = value || "";
				return value.length >= 2 ? value.substr(1, value.length-2) : value;
			} else if (type === "color") {
				// TODO
				return value;
			} else {
				return value;
			}
		}
	}
	if (type === "float") {
		return 0;
	} else {
		return "";
	}
}

function getPositionOptions(node) {
	return {
		x: getAttr(node, "x", "float"),
		y: getAttr(node, "y", "float"),
		width: getAttr(node, "width", "float"),
		height: getAttr(node, "height", "float")
	};
}

function getColorOptions(node) {
	return {
		fill: getAttr(node, "fill", "color"),
		stroke: getAttr(node, "stroke", "color")
	};
}

function getTextOptions(node) {
	return {
		align: getAttr(node, "align", "string"),
		fontFamily: getAttr(node, "font-family", "string"),
		fontSize: getAttr(node, "font-size", "float")
	};
}

function getLine(node, templateString) {
	let lineNumber = node.line;
	return templateString.split("\n")[lineNumber-1];
}

function stringToElements(templateString) {
	const ast = pugParser(pugLexer(templateString), {
		src: templateString
	});
	const elements = [];
	for (let node of ast.nodes) {
		let element;
		if (node.type === "Tag" && node.name === "rect") {
			// Rect element
			let options = Object.assign(
				getPositionOptions(node),
				getColorOptions(node),
				{
					node
				}
			);
			element = new Element(ElementTypes.RECT, options);
		}
		else if (node.type === "Mixin" && node.name === "text") {
			// Single-line text element
			let options = Object.assign(
				getPositionOptions(node),
				getColorOptions(node),
				getTextOptions(node),
				{
					node,
					fieldName: node.args
				}
			);
			element = new Element(ElementTypes.TEXT, options);
		}
		else if (node.type === "Mixin" && node.name === "textWrap") {
			// Multi-line text element
			let options = Object.assign(
				getPositionOptions(node),
				getColorOptions(node),
				getTextOptions(node),
				{
					node,
					lineHeight: getAttr(node, "line-height", "float"),
					fieldName: node.args
				}
			);
			element = new Element(ElementTypes.TEXT_WRAP, options);
		}
		else {
			// Fall back to code element
			element = new Element(ElementTypes.CODE, {
				node,
				value: getLine(node, templateString)
			});
		}
		elements.push(element);
	}
	return elements;
}

function elementsToString(elements) {
	// TODO
	return "xxx " + elements.length;
}

// TODO: Vue.component does not work any more
Vue.component("template-editor", {
	template: editorTemplate,
	props: ["modelValue"],
	emits: ["update:modelValue"],
	data: function() {
		return {
			elements: []
		};
	},
	computed: {
	},
	methods: {
	},
	watch: {
		modelValue: {
			handler: function(templateString) {
				this.elements = stringToElements(templateString);
			},
			immediate: true
		},
		elements: {
			handler: function(newValue /* , oldValue */) {
				let templateString = elementsToString(newValue);
				this.$emit("update:modelValue", templateString);
			},
			deep: true
		}
	}
});

// TODO: Vue.component does not work any more
Vue.component("template-element", {
	template: elementTemplate,
	props: ["element"],
});
//</script>

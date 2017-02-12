"use strict";

const CardCreatr = require("card-creatr");
const url = require("url");

module.exports = new (CardCreatr.CcsbReader)(url.parse(window.location.href, { parseQueryString: true }).query.path || null);

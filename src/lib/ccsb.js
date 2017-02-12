import CardCreatr from "card-creatr";
import url from "url";

export default new (CardCreatr.CcsbReader)(url.parse(window.location.href, { parseQueryString: true }).query.path || null);

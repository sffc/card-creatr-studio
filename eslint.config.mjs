import eslintConfig from "eslint/config";
import globals from "globals";
import js from "@eslint/js";

export default eslintConfig.defineConfig([
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
		plugins: { js },
		extends: ["js/recommended"],
		rules: {
			"no-debugger": process.env.NODE_ENV === "production" ? 2 : 0,
			"indent": ["error", "tab"],
			"linebreak-style": ["error", "unix"],
			"quotes": ["error", "double"],
			"semi": ["error", "always"],
			"no-console": "off",
			"no-useless-catch": "off",
		},
	},
	eslintConfig.globalIgnores([
		"**/node_modules/",
		"**/_old/",
		"**/build/",
		"**/config/",
		"**/vendor/",
	]),
]);

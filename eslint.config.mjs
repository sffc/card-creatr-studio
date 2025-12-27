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
		extends: ["js/all"],
		rules: {
			"no-debugger": process.env.NODE_ENV === "production" ? 2 : 0,
			"indent": ["error", "tab"],
			"linebreak-style": ["error", "unix"],
			"quotes": ["error", "double"],
			"semi": ["error", "always"],
			"no-console": "off",
			"no-useless-catch": "off",

			// Suppressions for js/all:
			// Too pedantic:
			"capitalized-comments": "off",
			"func-style": "off",
			"id-length": "off",
			"max-lines": "off",
			"max-lines-per-function": "off",
			"max-params": "off",
			"max-statements": "off",
			"no-else-return": "off",
			"no-magic-numbers": "off",
			"one-var": "off",
			"prefer-const": "off",
			"prefer-exponentiation-operator": "off",
			"prefer-object-has-own": "off",
			"prefer-object-spread": "off",
			"sort-keys": "off",
			// Permissible style:
			"curly": "off",
			"no-alert": "off",
			"no-inline-comments": "off",
			"no-nested-ternary": "off",
			"no-plusplus": "off",
			"no-ternary": "off",
			"no-underscore-dangle": "off",
			// Warnings not errors:
			"arrow-body-style": "warn",
			"prefer-destructuring": "warn",
			"prefer-template": "warn",
			"vars-on-top": "warn",
			// Re-enable after full ESM transition:
			"strict": "off",
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

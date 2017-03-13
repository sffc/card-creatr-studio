// http://eslint.org/docs/user-guide/configuring

module.exports = {
  extends: "eslint:recommended",
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true
  },
  "rules": {
    // allow debugger during development
    "no-debugger": process.env.NODE_ENV === "production" ? 2 : 0,
    "indent": [
      "error",
      "tab"
    ],
    "linebreak-style": [
      "error",
      "unix"
    ],
    "quotes": [
      "error",
      "double"
    ],
    "semi": [
      "error",
      "always"
    ],
    "no-console": "off"
  }
}

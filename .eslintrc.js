module.exports = {
  "extends": "airbnb-base",
  "plugins": [
    "import",
  ],
  "env": {
    "browser": "true",
  },
  "rules": {
    "arrow-parens": "off",
    "comma-dangle": [
      "error", {
        "arrays": "always-multiline",
        "objects": "always-multiline",
        "imports": "always-multiline",
        "exports": "always-multiline",
        "functions": "ignore",
      },
    ],
    "max-len": ["error", 120],
    "no-mixed-operators": "off",
    "no-plusplus": "off",
    "object-curly-spacing": "off",
  },
};

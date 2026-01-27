// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: "expo",
  // Expo Router files are auto-routed; linting them produces false positives (unused exports, etc.)
  ignorePatterns: ["app/**/*", "metro.config.js"],
  overrides: [
    {
      files: ["*.config.js", "*.config.cjs", "metro.config.js", "babel.config.js"],
      env: { node: true },
      parserOptions: { sourceType: "script" },
      globals: { __dirname: "readonly", module: "readonly", require: "readonly" }
    }
  ]
};

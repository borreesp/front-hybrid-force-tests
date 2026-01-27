module.exports = {
  root: true,
  extends: ["next/core-web-vitals"],
  plugins: ["unused-imports"],
  rules: {
    "unused-imports/no-unused-imports": "warn",
    "unused-imports/no-unused-vars": [
      "warn",
      { args: "after-used", argsIgnorePattern: "^_", vars: "all", varsIgnorePattern: "^_" }
    ]
  }
};

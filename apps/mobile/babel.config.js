const path = require("path");

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo", "nativewind/babel"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          extensions: [
            ".ios.ts",
            ".ios.tsx",
            ".android.ts",
            ".android.tsx",
            ".native.ts",
            ".native.tsx",
            ".ts",
            ".tsx",
            ".js",
            ".jsx",
            ".json",
          ],
          alias: {
            "@thrifty/core": path.resolve(__dirname, "../../packages/core/src"),
            "@thrifty/ui": path.resolve(__dirname, "../../packages/ui/src"),
            "@thrifty/utils": path.resolve(__dirname, "../../packages/utils/src"),
          },
        },
      ],
    ],
  };
};

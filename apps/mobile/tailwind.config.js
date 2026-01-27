const base = require("@thrifty/config/tailwind.config.base.cjs");
const nativewind = require("nativewind/preset");

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [nativewind],
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    ...(base.theme || {}),
    extend: {
      ...(base.theme?.extend || {})
    }
  },
  plugins: base.plugins || []
};

const tokens = require("./tokens.json");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: tokens.brandColors.surface,
          soft: tokens.brandColors.surfaceAlt
        },
        surface: {
          DEFAULT: tokens.brandColors.surface,
          alt: tokens.brandColors.surfaceAlt,
          subtle: "rgba(15,23,42,0.8)"
        },
        brand: {
          DEFAULT: tokens.brandColors.primary,
          dark: tokens.brandColors.primaryDark,
          accent: tokens.brandColors.accent
        },
        text: {
          DEFAULT: tokens.brandColors.text,
          soft: "rgba(148,163,184,1)"
        }
      },
      fontFamily: {
        sans: tokens.fonts.sans
      },
      borderRadius: {
        md: tokens.radii.md,
        lg: tokens.radii.lg,
        xl: tokens.radii.xl
      },
      boxShadow: {
        soft: "0 10px 40px rgba(0, 0, 0, 0.25)"
      }
    }
  },
  plugins: []
};

import tokens from "./tokens.json";

export const brandColors = tokens.brandColors;
export const radii = tokens.radii;
export const fonts = tokens.fonts;

export const tailwindTheme = {
  extend: {
    colors: {
      brand: {
        DEFAULT: brandColors.primary,
        dark: brandColors.primaryDark,
        accent: brandColors.accent
      },
      surface: {
        DEFAULT: brandColors.surface,
        alt: brandColors.surfaceAlt
      },
      text: brandColors.text
    },
    fontFamily: {
      sans: fonts.sans
    },
    borderRadius: {
      md: radii.md,
      lg: radii.lg,
      xl: radii.xl
    },
    boxShadow: {
      soft: "0 10px 40px rgba(0, 0, 0, 0.25)"
    }
  }
};

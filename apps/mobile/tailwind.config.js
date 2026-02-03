const base = require("@thrifty/config/tailwind.config.base.cjs");
const nativewind = require("nativewind/preset");

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [nativewind],
  content: [
    // Archivos de la app móvil
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}", // CRÍTICO: screens, components, utils
    // CRÍTICO: NativeWind necesita escanear packages/ui para procesar className
    // Esto incluye archivos .native.tsx que usan componentes nativos (View/Text/Pressable)
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    ...(base.theme || {}),
    extend: {
      ...(base.theme?.extend || {}),
      // Reforzar tokens para RN - colores hardcoded como fallback
      colors: {
        ...(base.theme?.extend?.colors || {}),
        brand: {
          DEFAULT: "#1FB6FF",
          dark: "#0EA5E9",
          accent: "#22C55E"
        },
        surface: {
          DEFAULT: "#0d1117",
          alt: "#111827",
          subtle: "rgba(15,23,42,0.8)"
        }
      }
    }
  },
  plugins: base.plugins || []
};

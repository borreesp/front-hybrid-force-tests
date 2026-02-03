const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");
const exclusionList = (additionalExclusions = []) => {
  const list = [/\/__tests__\/.*/];
  const escapeRegExp = (pattern) => {
    if (pattern instanceof RegExp) {
      return pattern.source.replace(/\/|\\\//g, "\\" + path.sep);
    }
    if (typeof pattern === "string") {
      const escaped = pattern.replace(/[\-\[\]\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
      return escaped.replaceAll("/", "\\" + path.sep);
    }
    throw new Error(`Expected exclusionList to be called with RegExp or string, got: ${typeof pattern}`);
  };
  return new RegExp("(" + additionalExclusions.concat(list).map(escapeRegExp).join("|") + ")$");
};

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Incluir workspace root para resolución de dependencias
config.watchFolders = [workspaceRoot];

// Bloquear AGRESIVAMENTE apps/web y todo contenido innecesario
config.resolver = {
  ...config.resolver,
  unstable_enableSymlinks: true,
  blockList: exclusionList([
    // Bloquear TODO apps/web
    new RegExp(workspaceRoot.replace(/\\/g, "/") + "/apps/web/.*"),
    new RegExp(workspaceRoot.replace(/\\/g, "/") + "/apps/web$"),
    // Bloquear .next COMPLETAMENTE
    /\.next/,
    // Bloquear archivos web en packages/ui (solo .tsx, NO .native.tsx)
    /packages\/ui\/src\/.*(?<!\.native)\.tsx$/,
    // Bloquear otros directorios innecesarios
    /\/dist\//,
    /\/build\//,
    /\/__tests__\//,
    /\.test\.(js|jsx|ts|tsx)$/,
    /\.spec\.(js|jsx|ts|tsx)$/,
  ]),
  nodeModulesPaths: [
    path.resolve(projectRoot, "node_modules"),
    path.resolve(workspaceRoot, "node_modules"),
  ],
  // Resolver explícito para paquetes del workspace
  extraNodeModules: {
    react: path.resolve(projectRoot, "node_modules/react"),
    "react-native": path.resolve(projectRoot, "node_modules/react-native"),
    "@thrifty/core": path.resolve(workspaceRoot, "packages/core"),
    "@thrifty/ui": path.resolve(workspaceRoot, "packages/ui"),
    "@thrifty/utils": path.resolve(workspaceRoot, "packages/utils"),
  },
  // Keep default sourceExts (includes mjs/cjs/css). Overriding breaks Expo SDK 54.
};

module.exports = withNativeWind(config, { input: "./global.css" });

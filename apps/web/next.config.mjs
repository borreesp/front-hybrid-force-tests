/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true
  },
  webpack: (config) => {
    // Evita cache en disco que puede dar problemas de permisos en Windows
    config.cache = {
      type: "memory"
    };
    return config;
  }
};

export default nextConfig;

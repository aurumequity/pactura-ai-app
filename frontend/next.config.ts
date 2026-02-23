import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      tailwindcss: './node_modules/tailwindcss',
    },
  },
};

export default nextConfig;
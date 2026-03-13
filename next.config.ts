import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "cmdlh0w91m.ufs.sh",
      },
    ],
  },
  webpack: (config, { dev, isServer }) => {
    // Reducir consumo de memoria en modo desarrollo para 8GB RAM
    if (dev && !isServer) {
      config.cache = false;
      config.optimization = {
        ...config.optimization,
        minimize: false,
        splitChunks: false,
      };
      config.watchOptions = {
        poll: 2000,
        aggregateTimeout: 500,
        ignored: /node_modules/,
      };
    }
    return config;
  },
};

export default nextConfig;

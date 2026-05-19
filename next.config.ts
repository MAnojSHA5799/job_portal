import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/jobs-in-:city',
        destination: '/jobs-in/:city',
      },
    ]
  },
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;

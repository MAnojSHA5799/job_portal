import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/job-in-:country',
        destination: '/locations/:country',
      },
      {
        source: '/job-in-:country/job-in-:city',
        destination: '/locations/:country/:city',
      },
    ]
  },
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;

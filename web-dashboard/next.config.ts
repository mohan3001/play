import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/git/:path*',
        destination: 'http://localhost:3001/api/git/:path*',
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination:
          "https://sync-engine-backend-0fsp.onrender.com/:path*",
      },
    ];
  },
};

export default nextConfig;
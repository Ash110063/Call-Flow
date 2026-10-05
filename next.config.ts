import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serve the static sales proposal at /proposal
  async rewrites() {
    return [{ source: "/proposal", destination: "/proposal/index.html" }];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  allowedDevOrigins: ["http://100.70.61.15:3001"],
  serverExternalPackages: ["@huggingface/transformers"],
};

export default nextConfig;

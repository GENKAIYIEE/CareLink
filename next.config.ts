import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1MB — raise to 4MB to accommodate cropped photo uploads (600×600 JPEG @ 0.9 quality)
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1MB — raise to 4MB to accommodate cropped photo uploads (600×600 JPEG @ 0.9 quality)
      bodySizeLimit: "4mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hrewkxeyscjewgigtdbi.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Aggressively cache the face-api model files — they never change between deploys.
  // This eliminates re-downloading 12+ MB of model binaries on every page load.
  async headers() {
    return [
      {
        source: "/models/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

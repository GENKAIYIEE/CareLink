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
  async headers() {
    return [
      // ─── Face model assets ──────────────────────────────────────────────────
      // Aggressively cache the face-api model files — they never change between deploys.
      // This eliminates re-downloading ~12 MB of model binaries on every page load.
      {
        source: "/models/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // ─── Content-Security-Policy for TensorFlow.js ─────────────────────────
      // Vercel's default CSP blocks 'eval()' and WASM execution, which TF.js
      // requires to compile WebGL shader programs and execute WASM binaries.
      // Without these, face detection silently fails in production with a
      // "no face detected" error even when a face is clearly visible.
      //
      // 'unsafe-eval'       → Required for TF.js WebGL shader compilation
      // 'wasm-unsafe-eval'  → Required for TF.js WASM backend (Chromium 95+)
      // blob:               → Required for TF.js to create WASM worker threads
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://hrewkxeyscjewgigtdbi.supabase.co",
              "media-src 'self' blob:",
              "connect-src 'self' https://hrewkxeyscjewgigtdbi.supabase.co wss://hrewkxeyscjewgigtdbi.supabase.co",
              "worker-src 'self' blob:",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;


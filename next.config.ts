import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Don't fail production builds on ESLint issues
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Keep type checking on; we fixed the real TS error
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;

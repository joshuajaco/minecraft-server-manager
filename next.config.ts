import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  experimental: { dynamicIO: true },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  productionBrowserSourceMaps: false,
  // Sonarr lives on your LAN; API calls happen server-side only.
  logging: { fetches: { fullUrl: false } },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets phones on the LAN load dev assets (HMR/JS) when testing via the network IP.
  allowedDevOrigins: ["192.168.15.2", "192.168.*.*"],
};

export default nextConfig;

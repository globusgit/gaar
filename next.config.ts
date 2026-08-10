import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security: do not expose dev origins in production
  deploymentId: process.env.NEXT_DEPLOYMENT_ID,
};

export default nextConfig;

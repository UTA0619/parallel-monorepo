import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@parallel/shared-types", "@parallel/supabase"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "oaidalleapiprodscus.blob.core.windows.net" },
    ],
  },
};

export default nextConfig;

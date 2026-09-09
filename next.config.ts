import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/tools/ohms-law",
        destination: "/tools/amps-kw",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/explore',
        destination: '/courses',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

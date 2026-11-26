import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Episodes can take several minutes. Do not cut the request short.
  experimental: {
    proxyTimeout: 20 * 60 * 1000,
  },
};

export default nextConfig;

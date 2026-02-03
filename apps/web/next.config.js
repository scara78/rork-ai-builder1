/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ai-engine/core', '@rork/shared'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    domains: ['localhost'],
  },
};

module.exports = nextConfig;

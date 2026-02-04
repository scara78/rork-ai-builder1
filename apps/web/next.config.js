/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ai-engine/core', '@rork/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
    ],
  },
  serverExternalPackages: ['formidable', 'pubnub', 'superagent'],
};

module.exports = nextConfig;

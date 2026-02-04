/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ai-engine/core', '@rork/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  serverExternalPackages: ['formidable', 'pubnub', 'superagent'],
};

module.exports = nextConfig;

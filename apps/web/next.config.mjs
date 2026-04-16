/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@hackathon/shared-types'],

  // Security headers for production
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Mobile PWA meta — allows adding to homescreen
          { key: 'X-UA-Compatible', value: 'IE=edge' },
        ],
      },
    ];
  },
};

export default nextConfig;

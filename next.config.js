/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.mapbox.com',
      },
    ],
  },
  reactStrictMode: true,
  // Optimize build performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Type checking configuration - temporarily skip during build for speed
  // Run type checking separately with: npx tsc --noEmit
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;

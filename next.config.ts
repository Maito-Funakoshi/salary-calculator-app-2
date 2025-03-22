import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only use 'export' and 'distDir' for production builds
  ...(process.env.NODE_ENV === 'production' 
    ? { 
        output: 'export',
        distDir: 'dist'
      } 
    : {}
  ),
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/a/**',
      },
    ],
  },
};

export default nextConfig;

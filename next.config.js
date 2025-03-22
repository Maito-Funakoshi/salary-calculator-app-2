// @ts-check
 
/** @type {import('next').NextConfig} */
const nextConfig = {
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
}
   
module.exports = nextConfig

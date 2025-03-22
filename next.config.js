// @ts-check
 
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.firebaseapp.com https://*.firebase.com"
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups'
          }
        ]
      }
    ]
  },
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

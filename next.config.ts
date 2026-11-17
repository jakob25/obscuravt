import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Friendly short links to existing pages (temporary, so they can change later)
  async redirects() {
    return [
      { source: '/nominate', destination: '/nominator', permanent: false },
      { source: '/quiz', destination: '/find-my-oshi', permanent: false },
      { source: '/oshi', destination: '/find-my-oshi', permanent: false },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

export default nextConfig

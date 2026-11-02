import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  basePath: process.env.BASEPATH,
  poweredByHeader: false,
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/home',
        permanent: true,
        locale: false
      }
    ]
  },

  // Training content must not be framed by other sites or cached by shared proxies
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), display-capture=()' }
        ]
      }
    ]
  }
}

export default nextConfig

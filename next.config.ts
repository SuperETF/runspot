import type { NextConfig } from "next";
import withPWA from '@ducanh2912/next-pwa';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['example.com'], // Add your image domains here
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_KAKAO_MAP_API_KEY: process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY,
  },
  // Static export for Capacitor compatibility
  // Note: Disabled for development with API routes. Enable for Capacitor build.
  // output: 'export',
  trailingSlash: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-eval' 'unsafe-inline' dapi.kakao.com t1.daumcdn.net t2.daumcdn.net t3.daumcdn.net t4.daumcdn.net",
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=*, camera=*, microphone=*',
          },
        ],
      },
    ];
  },
};

export default withPWA({
  dest: 'public',
  register: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/dapi\.kakao\.com\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'kakao-api-cache',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60 // 24 hours
          }
        }
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images-cache',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
          }
        }
      }
    ]
  }
})(nextConfig);

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['example.com'], // Add your image domains here
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_KAKAO_MAP_API_KEY: process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-eval' 'unsafe-inline' dapi.kakao.com",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

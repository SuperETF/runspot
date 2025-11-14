/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  
  // 보안 헤더 설정
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // HTTPS 강제 (HSTS)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          // 콘텐츠 타입 스니핑 방지
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // 클릭재킹 방지
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // XSS 보호
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // 리퍼러 정책
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // 권한 정책
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(self), camera=(self), microphone=(self), notifications=(self), payment=(), usb=(), bluetooth=()'
          },
          // 콘텐츠 보안 정책 (CSP)
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://dapi.kakao.com https://t1.kakaocdn.net https://maps.googleapis.com https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "media-src 'self' blob:",
              "connect-src 'self' https://*.supabase.co https://*.supabase.com https://dapi.kakao.com https://kapi.kakao.com https://apis.map.kakao.com https://maps.googleapis.com https://fcm.googleapis.com https://firebase.googleapis.com https://*.firebaseapp.com https://firestore.googleapis.com https://*.cloudflare.com https://jsdelivr.net https://unpkg.com https://*.runspot.seoul.kr wss://*.supabase.co wss://*.supabase.com",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          // Cross-Origin 정책
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp'
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin'
          }
        ]
      }
    ]
  },

  // 리다이렉트 설정 (HTTP -> HTTPS 강제)
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http'
          }
        ],
        destination: 'https://runspot.seoul.kr/:path*',
        permanent: true
      }
    ]
  },

  // 환경 변수
  env: {
    ENFORCE_HTTPS: 'true',
    SSL_VERIFY: 'true',
    SECURITY_HEADERS: 'true'
  },

  // 웹팩 설정
  webpack: (config, { isServer }) => {
    // 보안 관련 웹팩 플러그인 설정
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        stream: false,
        util: false
      }
    }
    
    return config
  },

  // 실험적 기능
  experimental: {
    // 보안 강화를 위한 설정
    strictNextHead: true,
    scrollRestoration: true
  }
}

module.exports = nextConfig

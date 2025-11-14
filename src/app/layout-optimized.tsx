import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";

// 폰트 최적화: preload와 display swap 사용
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono", 
  subsets: ["latin"],
  display: 'swap',
  preload: false, // 주 폰트가 아니므로 preload 하지 않음
});

export const metadata: Metadata = {
  title: "RunSpot Seoul | 서울의 베스트 런닝 코스",
  description: "서울의 숨겨진 런닝 코스를 발견하고 공유하는 커뮤니티. GPS 추적과 함께 안전하고 즐거운 러닝을 경험하세요.",
  keywords: "런닝, 조깅, 서울, 코스, GPS, 운동, 피트니스",
  authors: [{ name: "RunSpot Seoul" }],
  // 성능 최적화를 위한 메타데이터
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // PWA 관련 메타데이터
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'RunSpot Seoul',
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
  colorScheme: "dark",
};

// 카카오 스크립트를 지연 로딩으로 처리
const LazyKakaoScript = () => {
  const kakaoApiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY || '';
  
  return (
    <script 
      type="text/javascript" 
      src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoApiKey}&autoload=false`}
      async
      defer
    />
  );
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <head>
        {/* 중요한 리소스만 preconnect */}
        <link rel="preconnect" href="https://dapi.kakao.com" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        
        {/* 폰트 최적화 */}
        <link 
          rel="preload" 
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" 
          as="style"
          onLoad={(e) => {
            const link = e.target as HTMLLinkElement;
            link.onload = null;
            link.rel = 'stylesheet';
          }}
        />
        <noscript>
          <link 
            rel="stylesheet" 
            href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" 
          />
        </noscript>
        
        {/* PWA 관련 */}
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* 성능 최적화 힌트 */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning={true}
      >
        {/* 카카오 스크립트 지연 로딩 */}
        <Suspense fallback={null}>
          <LazyKakaoScript />
        </Suspense>
        
        {/* 메인 콘텐츠 */}
        <main id="main-content">
          {children}
        </main>
        
        {/* 성능 모니터링을 위한 스크립트 (개발 환경에서만) */}
        {process.env.NODE_ENV === 'development' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // 성능 메트릭 수집
                if ('performance' in window) {
                  window.addEventListener('load', () => {
                    setTimeout(() => {
                      const perfData = performance.getEntriesByType('navigation')[0];
                      console.log('🚀 페이지 로드 성능:', {
                        'DNS 조회': perfData.domainLookupEnd - perfData.domainLookupStart + 'ms',
                        'TCP 연결': perfData.connectEnd - perfData.connectStart + 'ms', 
                        'DOM 로딩': perfData.domContentLoadedEventEnd - perfData.navigationStart + 'ms',
                        '전체 로딩': perfData.loadEventEnd - perfData.navigationStart + 'ms'
                      });
                    }, 0);
                  });
                }
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}

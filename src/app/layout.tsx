import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppInitializer from "@/components/common/AppInitializer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RunSpot Seoul | 서울의 베스트 런닝 코스",
  description: "서울의 숨겨진 런닝 코스를 발견하고 공유하는 커뮤니티. GPS 추적과 함께 안전하고 즐거운 러닝을 경험하세요.",
  keywords: "런닝, 조깅, 서울, 코스, GPS, 운동, 피트니스",
  authors: [{ name: "RunSpot Seoul" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <head>
        <link rel="preconnect" href="https://dapi.kakao.com" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link 
          rel="stylesheet" 
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" 
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AppInitializer>
          {children}
        </AppInitializer>
      </body>
    </html>
  );
}

'use client'

import { useState } from 'react'
import KakaoMap from '@/components/common/KakaoMap'
import CoursePolyline from '@/components/common/CoursePolyline'
import CourseMarker from '@/components/common/CourseMarker'
import { GPSCoordinate } from '@/types/database'

export default function Home() {
  const [selectedPoint, setSelectedPoint] = useState<GPSCoordinate | null>(null)

  // 샘플 코스 데이터 (한강공원 여의도)
  const sampleRoute: GPSCoordinate[] = [
    { lat: 37.5285, lng: 126.9367 },
    { lat: 37.5290, lng: 126.9380 },
    { lat: 37.5295, lng: 126.9390 },
    { lat: 37.5300, lng: 126.9400 },
    { lat: 37.5305, lng: 126.9410 },
    { lat: 37.5300, lng: 126.9420 },
    { lat: 37.5295, lng: 126.9430 },
    { lat: 37.5290, lng: 126.9440 },
    { lat: 37.5285, lng: 126.9450 },
    { lat: 37.5280, lng: 126.9440 },
    { lat: 37.5275, lng: 126.9430 },
    { lat: 37.5270, lng: 126.9420 },
    { lat: 37.5275, lng: 126.9410 },
    { lat: 37.5280, lng: 126.9400 },
    { lat: 37.5285, lng: 126.9390 },
    { lat: 37.5285, lng: 126.9367 }
  ]

  const center = { lat: 37.5285, lng: 126.9400 }

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-primary">
            🏃‍♂️ RunSpot Seoul
          </h1>
          <p className="text-muted-foreground mt-2">
            서울의 베스트 런닝 코스를 발견하고 공유하세요
          </p>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 지도 섹션 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">샘플 코스: 한강공원 여의도</h2>
            <div className="rounded-lg overflow-hidden border border-border">
              <KakaoMap
                center={center}
                zoom={4}
                height="400px"
                onClick={(coord) => setSelectedPoint(coord)}
              >
                {/* 코스 경로 */}
                <CoursePolyline 
                  path={sampleRoute}
                  strokeColor="#00FF88"
                  strokeWeight={4}
                />
                
                {/* 시작점 마커 */}
                <CourseMarker
                  position={sampleRoute[0]}
                  type="start"
                  title="시작점"
                  content="한강공원 여의도 시작점"
                />
                
                {/* 종료점 마커 */}
                <CourseMarker
                  position={sampleRoute[sampleRoute.length - 1]}
                  type="end"
                  title="종료점"
                  content="한강공원 여의도 종료점"
                />

                {/* 클릭한 지점 마커 */}
                {selectedPoint && (
                  <CourseMarker
                    position={selectedPoint}
                    type="waypoint"
                    title="선택한 지점"
                    content={`위도: ${selectedPoint.lat.toFixed(6)}, 경도: ${selectedPoint.lng.toFixed(6)}`}
                  />
                )}
              </KakaoMap>
            </div>
          </div>

          {/* 정보 섹션 */}
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-lg border border-border">
              <h3 className="text-lg font-semibold mb-4">코스 정보</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">거리</span>
                  <span className="font-medium">5.2km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">예상 시간</span>
                  <span className="font-medium">35분</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">난이도</span>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm">
                    초급
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">코스 타입</span>
                  <span className="font-medium">한강</span>
                </div>
              </div>
            </div>

            {/* 클릭한 지점 정보 */}
            {selectedPoint && (
              <div className="bg-card p-6 rounded-lg border border-border">
                <h3 className="text-lg font-semibold mb-4">선택한 지점</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">위도</span>
                    <span className="font-mono text-sm">{selectedPoint.lat.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">경도</span>
                    <span className="font-mono text-sm">{selectedPoint.lng.toFixed(6)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 기능 설명 */}
            <div className="bg-card p-6 rounded-lg border border-border">
              <h3 className="text-lg font-semibold mb-4">Kakao Maps 연동 완료! 🎉</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✅ 지도 표시</li>
                <li>✅ 코스 경로 (폴리라인)</li>
                <li>✅ 시작/종료점 마커</li>
                <li>✅ 클릭 이벤트</li>
                <li>✅ 정보창 표시</li>
                <li>✅ 다크 테마 적용</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

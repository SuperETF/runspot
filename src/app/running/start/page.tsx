'use client'

import { useState, useEffect, Suspense } from 'react'
import { ArrowLeft, Play, Pause, Square, MapPin, Clock, Zap, Heart } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import RunningMap from '@/components/common/RunningMap'

function RunningStartContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseId = searchParams.get('courseId')
  
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [time, setTime] = useState(0) // 초 단위
  const [distance, setDistance] = useState(0) // km
  const [pace, setPace] = useState(0) // 분/km
  const [calories, setCalories] = useState(0)
  const [gpsDistance, setGpsDistance] = useState(0) // GPS로 측정된 실제 거리

  // URL 파라미터에서 코스 정보 가져오기
  const courseName = searchParams.get('courseName')
  
  // 샘플 코스 데이터 (실제로는 API에서 가져와야 함)
  const course = {
    id: courseId || '1',
    name: courseName ? decodeURIComponent(courseName) : '한강공원 여의도 코스',
    area: '여의도',
    distance: 5.2,
    difficulty: 'easy'
  }

  // 타이머 효과
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        setTime(prev => prev + 1)
        // 칼로리 계산 (거리 기반)
        setCalories(prev => prev + (gpsDistance * 0.05)) // 대략적 계산
      }, 1000)
    }
    
    return () => clearInterval(interval)
  }, [isRunning, isPaused, gpsDistance])

  // GPS 거리 업데이트 시 distance 동기화
  useEffect(() => {
    setDistance(gpsDistance)
  }, [gpsDistance])

  // 페이스 계산
  useEffect(() => {
    if (distance > 0 && time > 0) {
      const paceInMinutes = (time / 60) / distance
      setPace(paceInMinutes)
    }
  }, [distance, time])

  // GPS 위치 업데이트 콜백
  const handleLocationUpdate = (location: any) => {
    console.log('GPS 위치 업데이트:', location)
  }

  // GPS 거리 업데이트 콜백
  const handleDistanceUpdate = (newDistance: number) => {
    setGpsDistance(newDistance)
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatPace = (paceMinutes: number) => {
    if (paceMinutes === 0) return "0'00\""
    const minutes = Math.floor(paceMinutes)
    const seconds = Math.round((paceMinutes - minutes) * 60)
    return `${minutes}'${seconds.toString().padStart(2, '0')}"`
  }

  const startRunning = () => {
    setIsRunning(true)
    setIsPaused(false)
  }

  const pauseRunning = () => {
    setIsPaused(!isPaused)
  }

  const stopRunning = () => {
    if (confirm('런닝을 종료하시겠습니까?')) {
      // TODO: 결과 저장 및 결과 페이지로 이동
      alert(`런닝 완료!\n시간: ${formatTime(time)}\n거리: ${distance.toFixed(2)}km\n칼로리: ${Math.round(calories)}kcal`)
      router.back()
    }
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* 배경 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
      
      {/* 상단 헤더 */}
      <div className="relative z-10 sticky top-0 bg-black/80 backdrop-blur-xl border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-800 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-semibold">{course.name}</h1>
            <p className="text-xs text-gray-400">{course.area}</p>
          </div>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="relative z-10 px-4 py-6 space-y-6">
        {/* GPS 지도 */}
        <div className="mb-6">
          <RunningMap 
            isRunning={isRunning && !isPaused}
            onLocationUpdate={handleLocationUpdate}
            onDistanceUpdate={handleDistanceUpdate}
          />
        </div>

        {/* 메인 통계 */}
        <div className="text-center mb-8">
          {/* 시간 */}
          <div className="mb-6">
            <div className="text-6xl font-bold text-[#00FF88] mb-2 font-mono tracking-wider">
              {formatTime(time)}
            </div>
            <p className="text-gray-400 text-sm">경과 시간</p>
          </div>

          {/* 거리 */}
          <div className="mb-6">
            <div className="text-4xl font-bold text-white mb-1">
              {distance.toFixed(2)} <span className="text-2xl text-gray-400">km</span>
            </div>
            <p className="text-gray-400 text-sm">거리</p>
          </div>
        </div>

        {/* 세부 통계 */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* 페이스 */}
          <div className="bg-gray-900/80 glass rounded-2xl p-4 border border-gray-800 text-center">
            <div className="flex items-center justify-center mb-2">
              <Zap className="w-5 h-5 text-[#00FF88] mr-2" />
              <span className="text-sm text-gray-400">페이스</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {formatPace(pace)}
            </div>
            <p className="text-xs text-gray-500">/km</p>
          </div>

          {/* 칼로리 */}
          <div className="bg-gray-900/80 glass rounded-2xl p-4 border border-gray-800 text-center">
            <div className="flex items-center justify-center mb-2">
              <Heart className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-sm text-gray-400">칼로리</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {Math.round(calories)}
            </div>
            <p className="text-xs text-gray-500">kcal</p>
          </div>
        </div>

        {/* 진행률 */}
        <div className="bg-gray-900/80 glass rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">코스 진행률</span>
            <span className="text-sm text-[#00FF88]">
              {((distance / course.distance) * 100).toFixed(1)}%
            </span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
            <div 
              className="bg-gradient-to-r from-[#00FF88] to-[#00E077] h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((distance / course.distance) * 100, 100)}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>0km</span>
            <span>{course.distance}km</span>
          </div>
        </div>

        {/* 런닝 상태 메시지 */}
        <div className="text-center py-4">
          {!isRunning ? (
            <div>
              <div className="w-16 h-16 bg-[#00FF88] rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
                <Play className="w-8 h-8 text-black fill-current" />
              </div>
              <p className="text-gray-400">런닝을 시작할 준비가 되었습니다</p>
            </div>
          ) : isPaused ? (
            <div>
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Pause className="w-8 h-8 text-black" />
              </div>
              <p className="text-yellow-400">런닝이 일시정지되었습니다</p>
            </div>
          ) : (
            <div>
              <div className="w-16 h-16 bg-[#00FF88] rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
                <div className="w-4 h-4 bg-black rounded-full animate-ping"></div>
              </div>
              <p className="text-[#00FF88]">런닝 중입니다! 화이팅! 💪</p>
            </div>
          )}
        </div>
      </div>

      {/* 하단 컨트롤 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-gray-800 p-4">
        <div className="flex items-center justify-center gap-4">
          {!isRunning ? (
            /* 시작 버튼 */
            <button 
              onClick={startRunning}
              className="bg-[#00FF88] hover:bg-[#00E077] text-black font-bold px-8 py-4 rounded-2xl flex items-center gap-3 transition-all duration-300 transform hover:scale-105 neon-glow"
            >
              <Play className="w-6 h-6 fill-current" />
              런닝 시작
            </button>
          ) : (
            /* 런닝 중 컨트롤 */
            <div className="flex items-center gap-4">
              <button 
                onClick={pauseRunning}
                className={`${
                  isPaused ? 'bg-[#00FF88] text-black' : 'bg-yellow-500 text-black'
                } font-bold px-6 py-4 rounded-2xl flex items-center gap-2 transition-all duration-300`}
              >
                {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5" />}
                {isPaused ? '재개' : '일시정지'}
              </button>
              
              <button 
                onClick={stopRunning}
                className="bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-4 rounded-2xl flex items-center gap-2 transition-all duration-300"
              >
                <Square className="w-5 h-5" />
                종료
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 하단 여백 */}
      <div className="h-24"></div>
    </div>
  )
}

export default function RunningStartPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#00FF88] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </div>
    }>
      <RunningStartContent />
    </Suspense>
  )
}

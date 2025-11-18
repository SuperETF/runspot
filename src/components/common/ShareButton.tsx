'use client'

import { useEffect, useState } from 'react'
import { Share2, MessageCircle } from 'lucide-react'
import { initKakaoSDK, shareRunningCourse, shareRunningRecord, shareWithWebAPI } from '@/utils/kakaoShare'

interface ShareButtonProps {
  type: 'course' | 'record'
  data: {
    name: string
    area?: string
    distance: number
    difficulty?: string
    description?: string
    imageUrl?: string
    courseId: string
    time?: number
    pace?: number
    date?: string
    startPoint?: { lat: number; lng: number }
  }
  className?: string
  variant?: 'kakao' | 'general' | 'both'
}

export default function ShareButton({ 
  type, 
  data, 
  className = '',
  variant = 'both'
}: ShareButtonProps) {
  const [isKakaoReady, setIsKakaoReady] = useState(false)

  useEffect(() => {
    // 카카오 SDK 초기화
    const checkKakao = () => {
      if (typeof window !== 'undefined' && window.Kakao) {
        initKakaoSDK()
        setIsKakaoReady(true)
      } else {
        // 1초 후 다시 확인
        setTimeout(checkKakao, 1000)
      }
    }
    
    checkKakao()
  }, [])

  const handleKakaoShare = () => {
    if (!isKakaoReady) {
      alert('카카오톡 공유 기능을 준비 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    try {
      if (type === 'course') {
        shareRunningCourse({
          name: data.name,
          area: data.area || '',
          distance: data.distance,
          difficulty: data.difficulty || '보통',
          description: data.description,
          imageUrl: data.imageUrl,
          courseId: data.courseId,
          startPoint: data.startPoint
        })
      } else if (type === 'record' && data.time && data.pace && data.date) {
        shareRunningRecord({
          courseName: data.name,
          distance: data.distance,
          time: data.time,
          pace: data.pace,
          date: data.date,
          courseId: data.courseId
        })
      }
    } catch (error) {
      console.error('카카오톡 공유 실패:', error)
      alert('공유에 실패했습니다. 다시 시도해주세요.')
    }
  }

  const handleGeneralShare = () => {
    const shareUrl = `${window.location.origin}/course/${data.courseId}`
    const shareTitle = type === 'course' 
      ? `🏃‍♂️ ${data.name} - RunSpot`
      : `🏃‍♂️ 런닝 완주! ${data.name}`
    
    const shareText = type === 'course'
      ? `${data.area} • ${data.distance}km • ${data.difficulty}\n함께 달려요!`
      : `거리: ${data.distance.toFixed(2)}km • 완주 성공!`

    shareWithWebAPI({
      title: shareTitle,
      text: shareText,
      url: shareUrl
    })
  }

  if (variant === 'kakao') {
    return (
      <button
        onClick={handleKakaoShare}
        className={`flex items-center gap-2 px-4 py-2 bg-[#FEE500] text-black rounded-lg hover:bg-[#FDD835] transition-colors ${className}`}
        disabled={!isKakaoReady}
      >
        {/* 카카오톡 로고 SVG */}
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3C6.486 3 2 6.262 2 10.5c0 2.665 1.708 5.089 4.438 6.563L5.5 20l3.563-1.938C10.024 18.355 11.012 18.5 12 18.5c5.514 0 10-3.262 10-7.5S17.514 3 12 3z"/>
        </svg>
        <span className="text-sm font-medium">카카오톡 공유</span>
      </button>
    )
  }

  if (variant === 'general') {
    return (
      <button
        onClick={handleGeneralShare}
        className={`flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors ${className}`}
      >
        <Share2 className="w-4 h-4" />
        <span className="text-sm font-medium">공유하기</span>
      </button>
    )
  }

  // both variant - 두 개 버튼
  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        onClick={handleKakaoShare}
        className="flex items-center gap-2 px-3 py-2 bg-[#FEE500] text-black rounded-lg hover:bg-[#FDD835] transition-colors"
        disabled={!isKakaoReady}
        title="카카오톡으로 공유"
      >
        {/* 카카오톡 로고 SVG */}
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3C6.486 3 2 6.262 2 10.5c0 2.665 1.708 5.089 4.438 6.563L5.5 20l3.563-1.938C10.024 18.355 11.012 18.5 12 18.5c5.514 0 10-3.262 10-7.5S17.514 3 12 3z"/>
        </svg>
        <span className="text-xs font-medium">카톡</span>
      </button>
      
      <button
        onClick={handleGeneralShare}
        className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
        title="링크 공유"
      >
        <Share2 className="w-4 h-4" />
        <span className="text-xs font-medium">공유</span>
      </button>
    </div>
  )
}

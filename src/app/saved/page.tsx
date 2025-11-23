'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Bookmark, MapPin, Clock, Star, Trash2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useBookmarks } from '@/hooks/useBookmarks'

export default function SavedPage() {
  const router = useRouter()
  const { bookmarks, loading, error, removeFromBookmarks } = useBookmarks()

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '초급'
      case 'medium': return '중급'
      case 'hard': return '고급'
      default: return '초급'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-400'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400'
      case 'hard': return 'bg-red-500/20 text-red-400'
      default: return 'bg-green-500/20 text-green-400'
    }
  }

  const removeSavedCourse = async (courseId: string) => {
    const success = await removeFromBookmarks(courseId)
    if (!success && error) {
      alert(error)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 상단 헤더 - 모바일 알림창 피하기 */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-muted rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">저장된 코스</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* 로딩 상태 */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* 저장된 코스 개수 */}
        {!loading && (
          <div className="mb-6">
            <p className="text-muted-foreground text-sm">
              총 <span className="text-primary font-semibold">{bookmarks.length}개</span>의 코스를 저장했습니다
            </p>
          </div>
        )}

        {/* 저장된 코스 목록 */}
        {!loading && bookmarks.length > 0 ? (
          <div className="space-y-4">
            {bookmarks.map((bookmark, index) => {
              const course = bookmark.courses
              return (
              <div 
                key={course.id}
                className="bg-card/80 glass rounded-2xl p-4 border border-border hover:border-border/70 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-lg font-bold text-primary">RunSpot</h1>
                      <h3 className="text-lg font-semibold text-foreground">{course.name}</h3>
                      <Bookmark className="w-4 h-4 text-primary fill-current" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{course.area}</p>
                    
                    {/* 코스 정보 */}
                    <div className="flex items-center gap-3 text-sm mb-3 flex-wrap">
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-primary font-medium">{course.distance}km</span>
                      </div>
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-foreground">{course.duration}분</span>
                      </div>
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <span className="text-yellow-400">⭐</span>
                        <span className="text-foreground">{course.rating_avg}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap flex-shrink-0 ${getDifficultyColor(course.difficulty)}`}>
                        {getDifficultyText(course.difficulty)}
                      </span>
                    </div>

                    {/* 저장 날짜 */}
                    <p className="text-xs text-muted-foreground">
                      {new Date(bookmark.created_at).toLocaleDateString('ko-KR')} 저장
                    </p>
                  </div>

                  {/* 삭제 버튼 */}
                  <button
                    onClick={() => {
                      if (confirm('저장된 코스를 삭제하시겠습니까?')) {
                        removeSavedCourse(course.id)
                      }
                    }}
                    className="p-2 hover:bg-red-500/20 rounded-xl transition-colors group ml-2"
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-red-400 transition-colors" />
                  </button>
                </div>

                {/* 액션 버튼들 */}
                <div className="flex gap-2">
                  <button className="flex-1 bg-muted/80 hover:bg-primary hover:text-primary-foreground text-foreground py-2 px-4 rounded-xl transition-all duration-300 font-medium">
                    코스 보기
                  </button>
                  <button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded-xl transition-all duration-300 font-medium">
                    런닝 시작
                  </button>
                </div>
              </div>
            )})}
          </div>
        ) : (
          /* 빈 상태 */
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Bookmark className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">저장된 코스가 없습니다</h3>
            <p className="text-muted-foreground mb-6">마음에 드는 코스를 저장해보세요!</p>
            <button 
              onClick={() => router.push('/')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              코스 둘러보기
            </button>
          </div>
        )}

        {/* 하단 여백 */}
        <div className="h-20"></div>
      </div>
    </div>
  )
}

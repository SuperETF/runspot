'use client'

import { useState, useEffect } from 'react'
import { Bookmark } from 'lucide-react'
import { useBookmarks } from '@/hooks/useBookmarks'

interface BookmarkButtonProps {
  courseId: string
  className?: string
  showText?: boolean
}

export default function BookmarkButton({ courseId, className = '', showText = false }: BookmarkButtonProps) {
  const { toggleBookmarkStatus, checkBookmarkStatus } = useBookmarks()
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const checkStatus = async () => {
      const status = await checkBookmarkStatus(courseId)
      setIsBookmarked(status)
    }
    checkStatus()
  }, [courseId, checkBookmarkStatus])

  const handleToggle = async () => {
    setLoading(true)
    try {
      const newStatus = await toggleBookmarkStatus(courseId)
      setIsBookmarked(newStatus)
    } catch (error) {
      console.error('Error toggling bookmark:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`
        flex items-center gap-1 p-2 rounded-xl transition-all duration-200
        ${isBookmarked 
          ? 'bg-primary/20 text-primary hover:bg-primary/30' 
          : 'bg-muted/50 text-muted-foreground hover:bg-muted/80 hover:text-foreground'
        }
        ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
        ${className}
      `}
    >
      <Bookmark 
        className={`w-4 h-4 transition-all ${isBookmarked ? 'fill-current' : ''}`} 
      />
      {showText && (
        <span className="text-xs font-medium">
          {isBookmarked ? '저장됨' : '저장'}
        </span>
      )}
    </button>
  )
}

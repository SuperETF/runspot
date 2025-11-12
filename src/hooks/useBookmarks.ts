import { useState, useEffect } from 'react'
import { getUserBookmarks, addBookmark, removeBookmark, isBookmarked, toggleBookmark } from '@/lib/bookmarks'
import { getCurrentUser } from '@/lib/auth'

export interface BookmarkedCourse {
  id: string
  created_at: string
  course_id: string
  courses: {
    id: string
    name: string
    description: string
    distance: number
    duration: number
    difficulty: 'easy' | 'medium' | 'hard'
    course_type: 'park' | 'hangang' | 'urban' | 'mountain' | 'track'
    area: string
    rating_avg: number
    images: string[]
  }
}

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkedCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBookmarks = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const user = await getCurrentUser()
      if (!user) {
        setBookmarks([])
        return
      }

      const data = await getUserBookmarks(user.id)
      setBookmarks(data as BookmarkedCourse[])
    } catch (err) {
      console.error('Error fetching bookmarks:', err)
      setError(err instanceof Error ? err.message : '북마크를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const addToBookmarks = async (courseId: string) => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new Error('로그인이 필요합니다.')
      }

      await addBookmark(user.id, courseId)
      await fetchBookmarks() // 목록 새로고침
      return true
    } catch (err) {
      console.error('Error adding bookmark:', err)
      setError(err instanceof Error ? err.message : '북마크 추가에 실패했습니다.')
      return false
    }
  }

  const removeFromBookmarks = async (courseId: string) => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new Error('로그인이 필요합니다.')
      }

      await removeBookmark(user.id, courseId)
      await fetchBookmarks() // 목록 새로고침
      return true
    } catch (err) {
      console.error('Error removing bookmark:', err)
      setError(err instanceof Error ? err.message : '북마크 제거에 실패했습니다.')
      return false
    }
  }

  const toggleBookmarkStatus = async (courseId: string) => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new Error('로그인이 필요합니다.')
      }

      const isNowBookmarked = await toggleBookmark(user.id, courseId)
      await fetchBookmarks() // 목록 새로고침
      return isNowBookmarked
    } catch (err) {
      console.error('Error toggling bookmark:', err)
      setError(err instanceof Error ? err.message : '북마크 변경에 실패했습니다.')
      return false
    }
  }

  const checkBookmarkStatus = async (courseId: string): Promise<boolean> => {
    try {
      const user = await getCurrentUser()
      if (!user) return false

      return await isBookmarked(user.id, courseId)
    } catch (err) {
      console.error('Error checking bookmark status:', err)
      return false
    }
  }

  useEffect(() => {
    fetchBookmarks()
  }, [])

  return {
    bookmarks,
    loading,
    error,
    fetchBookmarks,
    addToBookmarks,
    removeFromBookmarks,
    toggleBookmarkStatus,
    checkBookmarkStatus
  }
}

export default useBookmarks

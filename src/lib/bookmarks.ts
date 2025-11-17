import { supabase } from './supabase'
import type { BookmarkInsert } from '@/types/database'

// 사용자의 북마크된 코스 목록 조회
export const getUserBookmarks = async (userId: string) => {

  const { data, error } = await supabase
    .from('bookmarks')
    .select(`
      id,
      created_at,
      course_id,
      courses (
        id,
        name,
        description,
        distance,
        duration,
        difficulty,
        course_type,
        area,
        rating_avg,
        images
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching bookmarks:', error)
    throw error
  }

  return data
}

// 코스 북마크 추가
export const addBookmark = async (userId: string, courseId: string) => {

  // 이미 북마크되어 있는지 확인
  const { data: existing } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single()

  if (existing) {
    throw new Error('이미 저장된 코스입니다.')
  }

  const bookmarkData: BookmarkInsert = {
    user_id: userId,
    course_id: courseId
  }

  const { data, error } = await supabase
    .from('bookmarks')
    .insert(bookmarkData as any)
    .select()
    .single()

  if (error) {
    console.error('Error adding bookmark:', error)
    throw error
  }

  return data
}

// 코스 북마크 제거
export const removeBookmark = async (userId: string, courseId: string) => {

  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', userId)
    .eq('course_id', courseId)

  if (error) {
    console.error('Error removing bookmark:', error)
    throw error
  }
}

// 특정 코스가 북마크되어 있는지 확인
export const isBookmarked = async (userId: string, courseId: string): Promise<boolean> => {

  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle()

    if (error) {
      console.error('Error checking bookmark:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Error checking bookmark:', error)
    return false
  }
}

// 북마크 토글 (있으면 제거, 없으면 추가)
export const toggleBookmark = async (userId: string, courseId: string) => {

  const bookmarked = await isBookmarked(userId, courseId)
  
  if (bookmarked) {
    await removeBookmark(userId, courseId)
    return false
  } else {
    await addBookmark(userId, courseId)
    return true
  }
}

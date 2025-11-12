import { supabase } from './supabase'
import { getCurrentUser } from './auth'
import type { InquiryInsert } from '@/types/database'

// 문의 제출
export const submitInquiry = async (inquiryData: Omit<InquiryInsert, 'user_id'>) => {
  try {
    const user = await getCurrentUser()
    
    const inquiry: InquiryInsert = {
      ...inquiryData,
      user_id: user?.id || null,
      status: 'pending'
    }

    const { data, error } = await supabase
      .from('inquiries')
      .insert(inquiry as any)
      .select()
      .single()

    if (error) {
      console.error('Error submitting inquiry:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error submitting inquiry:', error)
    throw error
  }
}

// 사용자의 문의 내역 조회
export const getUserInquiries = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user inquiries:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error fetching user inquiries:', error)
    throw error
  }
}

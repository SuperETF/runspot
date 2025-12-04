'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Users,
  Calendar,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  Lock,
  Camera,
  Loader2,
  ImageIcon,
  Link as LinkIcon,
  Instagram,
  Phone,
  MessageCircle,
  ChevronRight
} from 'lucide-react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

const ADMIN_PASSWORD = '090800'

interface CrewMember {
  id: string
  name: string
  role: string
  pace: string | null
  main_distance: string | null
  profile_image: string | null
  link_url: string | null
}

interface CrewSchedule {
  id: string
  title: string
  description: string | null
  schedule_date: string | null
  schedule_day: string | null
  time: string
  location: string
  distance: string | null
  pace: string | null
  is_regular: boolean
  is_completed: boolean
}

interface GalleryItem {
  id: string
  image_url: string
  caption: string | null
  instagram_url: string | null
}

interface ScheduleApplication {
  id: string
  schedule_id: string
  name: string
  phone: string
  kakao_id: string | null
  created_at: string
}

export default function FRCAdminPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  
  const [activeTab, setActiveTab] = useState<'members' | 'schedules' | 'gallery'>('members')
  const [members, setMembers] = useState<CrewMember[]>([])
  const [schedules, setSchedules] = useState<CrewSchedule[]>([])
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(false)

  // 멤버 추가/수정 폼
  const [showMemberForm, setShowMemberForm] = useState(false)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [memberForm, setMemberForm] = useState({
    name: '',
    role: '멤버',
    pace: '',
    main_distance: '',
    profile_image: '' as string | null,
    link_url: ''
  })
  const [uploading, setUploading] = useState(false)

  // 일정 추가/수정 폼
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null)
  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    description: '',
    schedule_date: '',
    schedule_day: '',
    time: '',
    location: '',
    distance: '',
    pace: '',
    max_participants: '',
    is_regular: false
  })

  // 갤러리 추가 폼
  const [showGalleryForm, setShowGalleryForm] = useState(false)
  const [galleryForm, setGalleryForm] = useState({
    image_url: '' as string | null,
    caption: '',
    instagram_url: ''
  })
  const [galleryUploading, setGalleryUploading] = useState(false)
  const [bulkUploadImages, setBulkUploadImages] = useState<string[]>([])
  const [bulkUploading, setBulkUploading] = useState(false)
  const [bulkUploadProgress, setBulkUploadProgress] = useState(0)

  // 신청자 목록 모달
  const [showApplicationsModal, setShowApplicationsModal] = useState(false)
  const [selectedScheduleForApps, setSelectedScheduleForApps] = useState<CrewSchedule | null>(null)
  const [applications, setApplications] = useState<ScheduleApplication[]>([])
  const [applicationsLoading, setApplicationsLoading] = useState(false)
  const [applicationCounts, setApplicationCounts] = useState<Record<string, number>>({})

  // 비밀번호 확인
  const handlePasswordSubmit = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      setPasswordError(false)
      loadData()
    } else {
      setPasswordError(true)
    }
  }

  // 데이터 로드
  const loadData = async () => {
    setLoading(true)
    try {
      const [membersRes, schedulesRes, galleryRes] = await Promise.all([
        (supabase as any).from('crew_members').select('*').eq('is_active', true),
        (supabase as any).from('crew_schedules').select('*').eq('is_active', true).order('created_at', { ascending: false }),
        (supabase as any).from('crew_gallery').select('*').eq('is_active', true).order('created_at', { ascending: false })
      ])
      
      setMembers(membersRes.data || [])
      setSchedules(schedulesRes.data || [])
      setGallery(galleryRes.data || [])

      // 일정별 신청자 수 로드
      if (schedulesRes.data && schedulesRes.data.length > 0) {
        const scheduleIds = schedulesRes.data.map((s: CrewSchedule) => s.id)
        const { data: appsData } = await (supabase as any)
          .from('schedule_applications')
          .select('schedule_id')
          .in('schedule_id', scheduleIds)
        
        if (appsData) {
          const counts: Record<string, number> = {}
          appsData.forEach((app: { schedule_id: string }) => {
            counts[app.schedule_id] = (counts[app.schedule_id] || 0) + 1
          })
          setApplicationCounts(counts)
        }
      }
    } catch (error) {
      // 에러 처리
    } finally {
      setLoading(false)
    }
  }

  // 신청자 목록 로드
  const loadApplications = async (schedule: CrewSchedule) => {
    setSelectedScheduleForApps(schedule)
    setShowApplicationsModal(true)
    setApplicationsLoading(true)
    
    try {
      const { data } = await (supabase as any)
        .from('schedule_applications')
        .select('*')
        .eq('schedule_id', schedule.id)
        .order('created_at', { ascending: false })
      
      setApplications(data || [])
    } catch (error) {
      // 에러 처리
    } finally {
      setApplicationsLoading(false)
    }
  }

  // 신청자 삭제
  const handleDeleteApplication = async (id: string) => {
    if (!confirm('이 신청자를 삭제하시겠습니까?')) return
    
    try {
      await (supabase as any).from('schedule_applications').delete().eq('id', id)
      setApplications(applications.filter(app => app.id !== id))
      // 카운트 업데이트
      if (selectedScheduleForApps) {
        setApplicationCounts(prev => ({
          ...prev,
          [selectedScheduleForApps.id]: (prev[selectedScheduleForApps.id] || 1) - 1
        }))
      }
    } catch (error) {
      // 에러 처리
    }
  }

  // 이미지 압축
  const compressImage = (file: File, maxWidth: number = 400, quality: number = 0.7): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = document.createElement('img')
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Canvas context not available'))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob)
              else reject(new Error('Compression failed'))
            },
            'image/jpeg',
            quality
          )
        }
        img.onerror = reject
        img.src = e.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // 이미지 업로드
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // 이미지 압축 (최대 400px, 품질 70%)
      const compressedBlob = await compressImage(file, 400, 0.7)
      
      const fileName = `${Date.now()}.jpg`
      const filePath = `crew-members/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, compressedBlob, {
          contentType: 'image/jpeg'
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      setMemberForm({ ...memberForm, profile_image: publicUrl })
    } catch (error) {
      alert('이미지 업로드에 실패했습니다')
    } finally {
      setUploading(false)
    }
  }

  // 멤버 추가
  const handleAddMember = async () => {
    if (!memberForm.name) return
    
    try {
      await (supabase as any).from('crew_members').insert({
        name: memberForm.name,
        role: memberForm.role,
        pace: memberForm.pace || null,
        main_distance: memberForm.main_distance || null,
        profile_image: memberForm.profile_image || null,
        link_url: memberForm.link_url || null,
        is_active: true
      })
      
      setMemberForm({ name: '', role: '멤버', pace: '', main_distance: '', profile_image: null, link_url: '' })
      setShowMemberForm(false)
      loadData()
    } catch (error) {
      // 에러 처리
    }
  }

  // 멤버 수정 시작
  const handleEditMember = (member: CrewMember) => {
    setEditingMemberId(member.id)
    setMemberForm({
      name: member.name,
      role: member.role,
      pace: member.pace || '',
      main_distance: member.main_distance || '',
      profile_image: member.profile_image,
      link_url: member.link_url || ''
    })
    setShowMemberForm(true)
  }

  // 멤버 수정 저장
  const handleUpdateMember = async () => {
    if (!memberForm.name || !editingMemberId) return
    
    try {
      await (supabase as any).from('crew_members').update({
        name: memberForm.name,
        role: memberForm.role,
        pace: memberForm.pace || null,
        main_distance: memberForm.main_distance || null,
        profile_image: memberForm.profile_image || null,
        link_url: memberForm.link_url || null
      }).eq('id', editingMemberId)
      
      setMemberForm({ name: '', role: '멤버', pace: '', main_distance: '', profile_image: null, link_url: '' })
      setEditingMemberId(null)
      setShowMemberForm(false)
      loadData()
    } catch (error) {
      // 에러 처리
    }
  }

  // 멤버 삭제
  const handleDeleteMember = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    
    try {
      await (supabase as any).from('crew_members').update({ is_active: false }).eq('id', id)
      loadData()
    } catch (error) {
      // 에러 처리
    }
  }

  // 날짜+시간이 지났는지 확인 (한국 시간 기준)
  const isPastSchedule = (date: string, time: string) => {
    if (!date) return false
    const scheduleDateTime = new Date(`${date}T${time || '23:59'}:00+09:00`)
    const now = new Date()
    return scheduleDateTime < now
  }

  // 일정 추가
  const handleAddSchedule = async () => {
    if (!scheduleForm.title || !scheduleForm.time || !scheduleForm.location) return
    
    // 날짜가 지났으면 자동으로 끝난 런닝으로 분류
    const isCompleted = isPastSchedule(scheduleForm.schedule_date, scheduleForm.time)
    
    try {
      await (supabase as any).from('crew_schedules').insert({
        title: scheduleForm.title,
        description: scheduleForm.description || null,
        schedule_date: scheduleForm.schedule_date || null,
        schedule_day: null,
        time: scheduleForm.time,
        location: scheduleForm.location,
        distance: scheduleForm.distance || null,
        pace: scheduleForm.pace || null,
        max_participants: scheduleForm.max_participants ? parseInt(scheduleForm.max_participants) : null,
        is_regular: scheduleForm.is_regular,
        is_completed: isCompleted,
        is_active: true
      })
      
      setScheduleForm({
        title: '',
        description: '',
        schedule_date: '',
        schedule_day: '',
        time: '',
        location: '',
        distance: '',
        pace: '',
        max_participants: '',
        is_regular: false
      })
      setShowScheduleForm(false)
      loadData()
    } catch (error) {
      // 에러 처리
    }
  }

  // 일정 수정 시작
  const handleEditSchedule = (schedule: CrewSchedule) => {
    setEditingScheduleId(schedule.id)
    setScheduleForm({
      title: schedule.title,
      description: schedule.description || '',
      schedule_date: schedule.schedule_date || '',
      schedule_day: schedule.schedule_day || '',
      time: schedule.time,
      location: schedule.location,
      distance: schedule.distance || '',
      pace: schedule.pace || '',
      max_participants: schedule.max_participants?.toString() || '',
      is_regular: schedule.is_regular
    })
    setShowScheduleForm(true)
  }

  // 일정 수정 저장
  const handleUpdateSchedule = async () => {
    if (!scheduleForm.title || !scheduleForm.time || !scheduleForm.location || !editingScheduleId) return
    
    // 날짜가 지났으면 자동으로 끝난 런닝으로 분류
    const isCompleted = isPastSchedule(scheduleForm.schedule_date, scheduleForm.time)
    
    try {
      await (supabase as any).from('crew_schedules').update({
        title: scheduleForm.title,
        description: scheduleForm.description || null,
        schedule_date: scheduleForm.schedule_date || null,
        schedule_day: null,
        time: scheduleForm.time,
        location: scheduleForm.location,
        distance: scheduleForm.distance || null,
        pace: scheduleForm.pace || null,
        max_participants: scheduleForm.max_participants ? parseInt(scheduleForm.max_participants) : null,
        is_regular: scheduleForm.is_regular,
        is_completed: isCompleted
      }).eq('id', editingScheduleId)
      
      setScheduleForm({
        title: '',
        description: '',
        schedule_date: '',
        schedule_day: '',
        time: '',
        location: '',
        distance: '',
        pace: '',
        max_participants: '',
        is_regular: false
      })
      setEditingScheduleId(null)
      setShowScheduleForm(false)
      loadData()
    } catch (error) {
      // 에러 처리
    }
  }

  // 일정 삭제
  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    
    try {
      await (supabase as any).from('crew_schedules').update({ is_active: false }).eq('id', id)
      loadData()
    } catch (error) {
      // 에러 처리
    }
  }

  // 일정 완료 토글
  const handleToggleComplete = async (id: string, currentStatus: boolean) => {
    try {
      await (supabase as any).from('crew_schedules').update({ is_completed: !currentStatus }).eq('id', id)
      loadData()
    } catch (error) {
      // 에러 처리
    }
  }

  // 갤러리 이미지 업로드
  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setGalleryUploading(true)
    try {
      // 갤러리용 이미지 압축 (최대 800px)
      const compressedBlob = await compressImage(file, 800, 0.8)
      
      const fileName = `${Date.now()}.jpg`
      const filePath = `crew-gallery/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, compressedBlob, {
          contentType: 'image/jpeg'
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      setGalleryForm({ ...galleryForm, image_url: publicUrl })
    } catch (error) {
      alert('이미지 업로드에 실패했습니다')
    } finally {
      setGalleryUploading(false)
    }
  }

  // 갤러리 추가
  const handleAddGallery = async () => {
    if (!galleryForm.image_url) return
    
    try {
      await (supabase as any).from('crew_gallery').insert({
        image_url: galleryForm.image_url,
        caption: galleryForm.caption || null,
        instagram_url: galleryForm.instagram_url || null,
        is_active: true
      })
      
      setGalleryForm({ image_url: null, caption: '', instagram_url: '' })
      setShowGalleryForm(false)
      loadData()
    } catch (error) {
      // 에러 처리
    }
  }

  // 갤러리 대량 업로드
  const handleBulkGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setBulkUploading(true)
    setBulkUploadProgress(0)
    const uploadedUrls: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const compressedBlob = await compressImage(file, 800, 0.8)
        const fileName = `${Date.now()}-${i}.jpg`
        const filePath = `crew-gallery/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, compressedBlob, {
            contentType: 'image/jpeg'
          })

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(filePath)
          uploadedUrls.push(publicUrl)
        }

        setBulkUploadProgress(Math.round(((i + 1) / files.length) * 100))
      }

      // DB에 일괄 저장
      if (uploadedUrls.length > 0) {
        const insertData = uploadedUrls.map(url => ({
          image_url: url,
          caption: null,
          instagram_url: null,
          is_active: true
        }))
        await (supabase as any).from('crew_gallery').insert(insertData)
        loadData()
      }

      alert(`${uploadedUrls.length}개 사진이 업로드되었습니다.`)
    } catch (error) {
      alert('일부 이미지 업로드에 실패했습니다')
    } finally {
      setBulkUploading(false)
      setBulkUploadProgress(0)
    }
  }

  // 갤러리 삭제
  const handleDeleteGallery = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    
    try {
      await (supabase as any).from('crew_gallery').update({ is_active: false }).eq('id', id)
      loadData()
    } catch (error) {
      // 에러 처리
    }
  }

  // 비밀번호 입력 화면
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F6F7F9] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
          <div className="flex items-center justify-center mb-6">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
              <Lock className="w-7 h-7 text-slate-600" />
            </div>
          </div>
          <h1 className="text-lg font-bold text-slate-900 text-center mb-2">FRC 관리자</h1>
          <p className="text-[12px] text-slate-500 text-center mb-6">비밀번호를 입력해주세요</p>
          
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            placeholder="비밀번호"
            className={`w-full px-4 py-3 rounded-xl border ${passwordError ? 'border-red-400' : 'border-slate-200'} text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-slate-200`}
          />
          {passwordError && (
            <p className="text-[11px] text-red-500 text-center mt-2">비밀번호가 틀렸습니다</p>
          )}
          
          <button
            onClick={handlePasswordSubmit}
            className="w-full mt-4 py-3 rounded-xl bg-slate-900 text-white text-[13px] font-semibold"
          >
            확인
          </button>
          
          <button
            onClick={() => router.back()}
            className="w-full mt-2 py-3 rounded-xl bg-slate-100 text-slate-600 text-[13px] font-medium"
          >
            돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F6F7F9]">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <span className="text-base font-semibold text-slate-900">FRC 관리자</span>
          <div className="w-9" />
        </div>
      </header>

      {/* 탭 */}
      <div className="bg-white border-b border-slate-100">
        <div className="flex">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-3 text-[13px] font-semibold border-b-2 transition-colors ${
              activeTab === 'members'
                ? 'text-slate-900 border-slate-900'
                : 'text-slate-400 border-transparent'
            }`}
          >
            <Users className="w-4 h-4 inline-block mr-1" />
            멤버 관리
          </button>
          <button
            onClick={() => setActiveTab('schedules')}
            className={`flex-1 py-3 text-[13px] font-semibold border-b-2 transition-colors ${
              activeTab === 'schedules'
                ? 'text-slate-900 border-slate-900'
                : 'text-slate-400 border-transparent'
            }`}
          >
            <Calendar className="w-4 h-4 inline-block mr-1" />
            일정
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex-1 py-3 text-[13px] font-semibold border-b-2 transition-colors ${
              activeTab === 'gallery'
                ? 'text-slate-900 border-slate-900'
                : 'text-slate-400 border-transparent'
            }`}
          >
            <ImageIcon className="w-4 h-4 inline-block mr-1" />
            갤러리
          </button>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="p-4 pb-24">
        {/* 멤버 관리 */}
        {activeTab === 'members' && (
          <div>
            {/* 멤버 추가/수정 폼 */}
            {showMemberForm ? (
              <div className="bg-white rounded-xl p-4 mb-4">
                <h3 className="text-[13px] font-semibold text-slate-900 mb-3">
                  {editingMemberId ? '멤버 수정' : '새 멤버 추가'}
                </h3>
                <div className="space-y-3">
                  {/* 프로필 이미지 */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                      {memberForm.profile_image ? (
                        <Image
                          src={memberForm.profile_image}
                          alt="프로필"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <Camera className="w-6 h-6 text-slate-400" />
                      )}
                      {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <label className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <div className="px-3 py-2 rounded-lg border border-slate-200 text-[12px] text-slate-600 text-center cursor-pointer hover:bg-slate-50">
                        {uploading ? '업로드 중...' : '사진 선택'}
                      </div>
                    </label>
                  </div>
                  
                  <input
                    type="text"
                    value={memberForm.name}
                    onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                    placeholder="이름"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-[13px]"
                  />
                  <select
                    value={memberForm.role}
                    onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-[13px]"
                  >
                    <option value="멤버">멤버</option>
                    <option value="그로워">그로워</option>
                    <option value="페이서">페이서</option>
                    <option value="크루장">크루장</option>
                  </select>
                  <input
                    type="text"
                    value={memberForm.pace}
                    onChange={(e) => setMemberForm({ ...memberForm, pace: e.target.value })}
                    placeholder="페이스 (예: 5:30)"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-[13px]"
                  />
                  <input
                    type="text"
                    value={memberForm.main_distance}
                    onChange={(e) => setMemberForm({ ...memberForm, main_distance: e.target.value })}
                    placeholder="주력 거리 (예: 10K)"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-[13px]"
                  />
                  <input
                    type="url"
                    value={memberForm.link_url}
                    onChange={(e) => setMemberForm({ ...memberForm, link_url: e.target.value })}
                    placeholder="링크 URL (예: https://instagram.com/...)"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-[13px]"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowMemberForm(false)
                        setEditingMemberId(null)
                        setMemberForm({ name: '', role: '멤버', pace: '', main_distance: '', profile_image: null, link_url: '' })
                      }}
                      className="flex-1 py-2.5 rounded-lg bg-slate-100 text-slate-600 text-[12px] font-medium"
                    >
                      취소
                    </button>
                    <button
                      onClick={editingMemberId ? handleUpdateMember : handleAddMember}
                      className="flex-1 py-2.5 rounded-lg bg-slate-900 text-white text-[12px] font-medium"
                    >
                      {editingMemberId ? '수정' : '추가'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowMemberForm(true)}
                className="w-full py-3 rounded-xl bg-white border-2 border-dashed border-slate-200 text-slate-500 text-[12px] font-medium mb-4 flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" />
                멤버 추가
              </button>
            )}

            {/* 멤버 목록 */}
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => handleEditMember(member)}
                >
                  {/* 프로필 이미지 */}
                  <div className="relative w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {member.profile_image ? (
                      <Image
                        src={member.profile_image}
                        alt={member.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <Users className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-slate-900">{member.name}</p>
                      <span className={`inline-flex items-center rounded-full px-2 py-[1px] text-[9px] font-medium ${
                        member.role === '크루장' ? 'bg-slate-900 text-white' :
                        member.role === '페이서' ? 'bg-violet-600 text-white' :
                        member.role === '그로워' ? 'bg-emerald-500 text-white' :
                        'bg-slate-200 text-slate-600'
                      }`}>
                        {member.role}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {member.pace && `페이스 ${member.pace}/km`}
                      {member.pace && member.main_distance && ' · '}
                      {member.main_distance && `주력 ${member.main_distance}`}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteMember(member.id)
                    }}
                    className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 일정 관리 */}
        {activeTab === 'schedules' && (
          <div>
            {/* 일정 추가/수정 폼 */}
            {showScheduleForm ? (
              <div className="bg-white rounded-xl p-4 mb-4">
                <h3 className="text-[13px] font-semibold text-slate-900 mb-3">
                  {editingScheduleId ? '일정 수정' : '새 일정 추가'}
                </h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={scheduleForm.title}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                    placeholder="일정 제목"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-[13px]"
                  />
                  <textarea
                    value={scheduleForm.description}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                    placeholder="설명 (선택)"
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-[13px] resize-none"
                  />
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={scheduleForm.is_regular}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, is_regular: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-[12px] text-slate-600">정기 런닝 (카테고리)</span>
                  </label>

                  <input
                    type="date"
                    value={scheduleForm.schedule_date}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, schedule_date: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-[13px]"
                  />

                  <div className="relative">
                    <input
                      type="text"
                      value={scheduleForm.time}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                      placeholder="시간 (예: 19:00, 오후 7시)"
                      list="time-suggestions"
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-[13px]"
                    />
                    <datalist id="time-suggestions">
                      <option value="06:00">오전 6시</option>
                      <option value="06:30">오전 6시 30분</option>
                      <option value="07:00">오전 7시</option>
                      <option value="07:30">오전 7시 30분</option>
                      <option value="08:00">오전 8시</option>
                      <option value="18:00">오후 6시</option>
                      <option value="18:30">오후 6시 30분</option>
                      <option value="19:00">오후 7시</option>
                      <option value="19:30">오후 7시 30분</option>
                      <option value="20:00">오후 8시</option>
                      <option value="20:30">오후 8시 30분</option>
                      <option value="21:00">오후 9시</option>
                    </datalist>
                  </div>
                  <input
                    type="text"
                    value={scheduleForm.location}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })}
                    placeholder="장소"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-[13px]"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={scheduleForm.distance}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, distance: e.target.value })}
                      placeholder="거리 (예: 10K)"
                      className="flex-1 px-3 py-2.5 rounded-lg border border-slate-200 text-[13px]"
                    />
                    <input
                      type="text"
                      value={scheduleForm.pace}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, pace: e.target.value })}
                      placeholder="페이스 (예: 6:00)"
                      className="flex-1 px-3 py-2.5 rounded-lg border border-slate-200 text-[13px]"
                    />
                  </div>
                  <input
                    type="number"
                    value={scheduleForm.max_participants}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, max_participants: e.target.value })}
                    placeholder="제한 인원 (선택, 예: 20)"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-[13px]"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowScheduleForm(false)
                        setEditingScheduleId(null)
                        setScheduleForm({
                          title: '',
                          description: '',
                          schedule_date: '',
                          schedule_day: '',
                          time: '',
                          location: '',
                          distance: '',
                          pace: '',
                          max_participants: '',
                          is_regular: false
                        })
                      }}
                      className="flex-1 py-2.5 rounded-lg bg-slate-100 text-slate-600 text-[12px] font-medium"
                    >
                      취소
                    </button>
                    <button
                      onClick={editingScheduleId ? handleUpdateSchedule : handleAddSchedule}
                      className="flex-1 py-2.5 rounded-lg bg-slate-900 text-white text-[12px] font-medium"
                    >
                      {editingScheduleId ? '수정' : '추가'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowScheduleForm(true)}
                className="w-full py-3 rounded-xl bg-white border-2 border-dashed border-slate-200 text-slate-500 text-[12px] font-medium mb-4 flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" />
                일정 추가
              </button>
            )}

            {/* 일정 목록 */}
            <div className="space-y-2">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  onClick={() => handleEditSchedule(schedule)}
                  className={`bg-white rounded-xl px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${schedule.is_completed ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center rounded-full px-2 py-[1px] text-[9px] font-medium ${
                          schedule.is_completed ? 'bg-slate-400 text-white' :
                          schedule.is_regular ? 'bg-slate-900 text-white' :
                          'bg-violet-600 text-white'
                        }`}>
                          {schedule.is_completed ? '완료' : schedule.is_regular ? '정기' : '특별'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {schedule.is_regular ? `매주 ${schedule.schedule_day}` : schedule.schedule_date}
                        </span>
                      </div>
                      <p className="text-[13px] font-semibold text-slate-900">{schedule.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {schedule.time} · {schedule.location}
                        {schedule.distance && ` · ${schedule.distance}`}
                      </p>
                      {/* 신청자 수 */}
                      {applicationCounts[schedule.id] > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            loadApplications(schedule)
                          }}
                          className="mt-1.5 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-medium hover:bg-blue-100 transition-colors"
                        >
                          <Users className="w-3 h-3" />
                          {applicationCounts[schedule.id]}명 신청
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleComplete(schedule.id, schedule.is_completed)
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          schedule.is_completed ? 'bg-green-50' : 'bg-slate-100'
                        }`}
                      >
                        <Check className={`w-4 h-4 ${schedule.is_completed ? 'text-green-500' : 'text-slate-400'}`} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteSchedule(schedule.id)
                        }}
                        className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 갤러리 관리 */}
        {activeTab === 'gallery' && (
          <div>
            {/* 갤러리 추가 폼 */}
            {showGalleryForm ? (
              <div className="bg-white rounded-xl p-4 mb-4">
                <h3 className="text-[13px] font-semibold text-slate-900 mb-3">사진 추가</h3>
                <div className="space-y-3">
                  {/* 이미지 업로드 */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative w-full aspect-square rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden">
                      {galleryForm.image_url ? (
                        <Image
                          src={galleryForm.image_url}
                          alt="갤러리 이미지"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-12 h-12 text-slate-300" />
                      )}
                      {galleryUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <label className="w-full">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleGalleryImageUpload}
                        className="hidden"
                      />
                      <div className="px-3 py-2.5 rounded-lg border border-slate-200 text-[12px] text-slate-600 text-center cursor-pointer hover:bg-slate-50">
                        {galleryUploading ? '업로드 중...' : '사진 선택'}
                      </div>
                    </label>
                  </div>
                  
                  <input
                    type="text"
                    value={galleryForm.caption}
                    onChange={(e) => setGalleryForm({ ...galleryForm, caption: e.target.value })}
                    placeholder="설명 (선택)"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-[13px]"
                  />
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-slate-400" />
                    <input
                      type="url"
                      value={galleryForm.instagram_url}
                      onChange={(e) => setGalleryForm({ ...galleryForm, instagram_url: e.target.value })}
                      placeholder="인스타그램 게시물 URL (선택)"
                      className="flex-1 px-3 py-2.5 rounded-lg border border-slate-200 text-[13px]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowGalleryForm(false)
                        setGalleryForm({ image_url: null, caption: '', instagram_url: '' })
                      }}
                      className="flex-1 py-2.5 rounded-lg bg-slate-100 text-slate-600 text-[12px] font-medium"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleAddGallery}
                      disabled={!galleryForm.image_url}
                      className="flex-1 py-2.5 rounded-lg bg-slate-900 text-white text-[12px] font-medium disabled:opacity-50"
                    >
                      추가
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                <button
                  onClick={() => setShowGalleryForm(true)}
                  className="w-full py-3 rounded-xl bg-white border-2 border-dashed border-slate-200 text-slate-500 text-[12px] font-medium flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  사진 추가 (1장)
                </button>
                
                {/* 대량 업로드 */}
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleBulkGalleryUpload}
                    className="hidden"
                    disabled={bulkUploading}
                  />
                  <div className={`w-full py-3 rounded-xl bg-slate-900 text-white text-[12px] font-medium flex items-center justify-center gap-1 cursor-pointer ${bulkUploading ? 'opacity-50' : 'hover:bg-slate-800'}`}>
                    {bulkUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        업로드 중... {bulkUploadProgress}%
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4" />
                        대량 업로드 (여러 장)
                      </>
                    )}
                  </div>
                </label>
                
                {/* 업로드 진행률 바 */}
                {bulkUploading && (
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-slate-900 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${bulkUploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* 갤러리 목록 */}
            <div className="grid grid-cols-3 gap-2">
              {gallery.map((item) => (
                <div
                  key={item.id}
                  className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 group"
                >
                  <Image
                    src={item.image_url}
                    alt={item.caption || '갤러리 이미지'}
                    fill
                    className="object-cover"
                  />
                  {item.instagram_url && (
                    <div className="absolute top-1 left-1">
                      <Instagram className="w-4 h-4 text-white drop-shadow-lg" />
                    </div>
                  )}
                  <button
                    onClick={() => handleDeleteGallery(item.id)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                  {item.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-[10px] text-white truncate">{item.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {gallery.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-[12px]">
                등록된 사진이 없습니다
              </div>
            )}
          </div>
        )}
      </div>

      {/* 신청자 목록 모달 */}
      {showApplicationsModal && selectedScheduleForApps && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md overflow-hidden animate-in slide-in-from-bottom sm:fade-in sm:zoom-in-95 duration-200 max-h-[80vh] flex flex-col">
            {/* 헤더 */}
            <div className="p-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">신청자 목록</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{selectedScheduleForApps.title}</p>
                </div>
                <button
                  onClick={() => {
                    setShowApplicationsModal(false)
                    setSelectedScheduleForApps(null)
                    setApplications([])
                  }}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>

            {/* 신청자 목록 */}
            <div className="flex-1 overflow-y-auto p-4">
              {applicationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-[12px] text-slate-400">신청자가 없습니다</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {applications.map((app, index) => (
                    <div
                      key={app.id}
                      className="bg-slate-50 rounded-xl p-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] text-slate-400">#{index + 1}</span>
                            <p className="text-[13px] font-semibold text-slate-900">{app.name}</p>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500">
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <a href={`tel:${app.phone}`} className="hover:text-slate-700">{app.phone}</a>
                            </div>
                            {app.kakao_id && (
                              <div className="flex items-center gap-1">
                                <MessageCircle className="w-3 h-3" />
                                <span>{app.kakao_id}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(app.created_at).toLocaleString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteApplication(app.id)}
                          className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 하단 정보 */}
            <div className="p-4 border-t border-slate-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <p className="text-[12px] text-slate-500">
                  총 <span className="font-semibold text-slate-900">{applications.length}명</span> 신청
                </p>
                <button
                  onClick={() => {
                    setShowApplicationsModal(false)
                    setSelectedScheduleForApps(null)
                    setApplications([])
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white text-[12px] font-medium"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

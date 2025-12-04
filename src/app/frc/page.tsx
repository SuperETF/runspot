'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Users,
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  Instagram,
  MessageCircle,
  ArrowLeft,
  Heart,
  Zap,
  Target,
  Award,
  Rocket,
  Loader2,
  Check
} from 'lucide-react'
import {
  getCrewMembers,
  getCrewSchedules,
  getCrewGallery,
  getCrewStats,
  getUpcomingSchedules,
  calculateDday,
  type CrewMember,
  type CrewSchedule,
  type CrewGalleryItem,
  type CrewStats
} from '@/lib/crew'

export default function FRCPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'schedule' | 'members' | 'gallery'>('schedule')
  const [showDevModal, setShowDevModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [contactName, setContactName] = useState('')
  const [contactId, setContactId] = useState('')
  const [loading, setLoading] = useState(true)

  // 일정 상세 모달
  const [showScheduleDetail, setShowScheduleDetail] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<CrewSchedule | null>(null)

  // 런닝 신청 모달
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applyStep, setApplyStep] = useState(-1) // -1: 크루원/게스트 선택, 0: 약관동의, 1: 이름, 2: 전화번호, 3: 카카오ID, 4: 완료
  const [applyScheduleId, setApplyScheduleId] = useState<string | null>(null)
  const [applyForm, setApplyForm] = useState({
    name: '',
    phone: '',
    kakaoId: ''
  })
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [applySubmitting, setApplySubmitting] = useState(false)
  const [showTermsDetail, setShowTermsDetail] = useState<'terms' | 'privacy' | null>(null)
  const [showCrewNoticeModal, setShowCrewNoticeModal] = useState(false)

  // DB 데이터 상태
  const [members, setMembers] = useState<CrewMember[]>([])
  const [schedules, setSchedules] = useState<CrewSchedule[]>([])
  const [gallery, setGallery] = useState<CrewGalleryItem[]>([])
  const [stats, setStats] = useState<CrewStats | null>(null)
  const [upcomingSchedules, setUpcomingSchedules] = useState<CrewSchedule[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [applicationCounts, setApplicationCounts] = useState<Record<string, number>>({})

  // 홍보 팝업 모달
  const [showPromoModal, setShowPromoModal] = useState(false)
  const [promoSlide, setPromoSlide] = useState(0)

  useEffect(() => {
    loadData()
    
    // 오늘 하루 그만보기 체크
    const hideUntil = localStorage.getItem('frc_promo_hide_until')
    if (hideUntil) {
      const hideDate = new Date(hideUntil)
      if (new Date() < hideDate) {
        return // 아직 숨김 기간
      }
    }
    setShowPromoModal(true)
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [membersData, schedulesData, galleryData, statsData, upcomingData] = await Promise.all([
        getCrewMembers(),
        getCrewSchedules(),
        getCrewGallery(20), // 최대 20장 (2x2 그리드 5세트)
        getCrewStats(),
        getUpcomingSchedules(5) // 다가오는 일정 최대 5개
      ])

      setMembers(membersData)
      setSchedules(schedulesData)
      setGallery(galleryData)
      setStats(statsData)
      setUpcomingSchedules(upcomingData)

      // 일정별 신청자 수 로드
      const allScheduleIds = [
        ...schedulesData.map((s: CrewSchedule) => s.id),
        ...upcomingData.map((s: CrewSchedule) => s.id)
      ]
      if (allScheduleIds.length > 0) {
        const { supabase } = await import('@/lib/supabase')
        const { data: appsData } = await (supabase as any)
          .from('schedule_applications')
          .select('schedule_id')
          .in('schedule_id', allScheduleIds)
        
        if (appsData) {
          const counts: Record<string, number> = {}
          appsData.forEach((app: { schedule_id: string }) => {
            counts[app.schedule_id] = (counts[app.schedule_id] || 0) + 1
          })
          setApplicationCounts(counts)
        }
      }
    } catch (error) {
      // 에러 시 기본값 유지
    } finally {
      setLoading(false)
    }
  }

  // 자동 슬라이드 (3초마다 무한 루프)
  useEffect(() => {
    if (upcomingSchedules.length <= 1) return
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % upcomingSchedules.length)
    }, 3000)
    
    return () => clearInterval(interval)
  }, [upcomingSchedules.length])

  // 통계 데이터 (하드코딩)
  const crewStatsData = [
    { label: '총 멤버', value: '239명', icon: Users },
    { label: '총 거리', value: '1,092km', icon: MapPin },
    { label: '평균 페이스', value: '6:50', icon: Clock },
  ]

  // 일정 상세 모달 열기
  const openScheduleDetail = (schedule: CrewSchedule) => {
    setSelectedSchedule(schedule)
    setShowScheduleDetail(true)
  }

  // 런닝 신청 모달 열기
  const openApplyModal = (scheduleId: string) => {
    setShowScheduleDetail(false) // 상세 모달 닫기
    setApplyScheduleId(scheduleId)
    setApplyStep(-1) // 크루원/게스트 선택부터 시작
    setApplyForm({ name: '', phone: '', kakaoId: '' })
    setAgreeTerms(false)
    setAgreePrivacy(false)
    setShowApplyModal(true)
  }

  // 크루원 선택 시
  const handleCrewMemberSelect = () => {
    setShowApplyModal(false)
    setShowCrewNoticeModal(true)
  }

  // 게스트 선택 시
  const handleGuestSelect = () => {
    setApplyStep(0) // 약관 동의 단계로
  }

  // 다음 단계로
  const handleApplyNext = () => {
    if (applyStep === 0 && (!agreeTerms || !agreePrivacy)) return
    if (applyStep === 1 && !applyForm.name.trim()) return
    if (applyStep === 2 && !applyForm.phone.trim()) return
    
    if (applyStep === 3) {
      // 마지막 단계에서 신청 제출
      handleApplySubmit()
    } else if (applyStep < 3) {
      setApplyStep(applyStep + 1)
    }
  }

  // 신청 제출
  const handleApplySubmit = async () => {
    if (!applyScheduleId) return
    
    setApplySubmitting(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      
      // 제한 인원 체크
      const { data: scheduleData } = await (supabase as any)
        .from('crew_schedules')
        .select('max_participants')
        .eq('id', applyScheduleId)
        .single()
      
      const currentCount = applicationCounts[applyScheduleId] || 0
      if (scheduleData?.max_participants && currentCount >= scheduleData.max_participants) {
        alert(`신청이 마감되었습니다. (제한 인원: ${scheduleData.max_participants}명)`)
        setApplySubmitting(false)
        return
      }
      
      // 중복 신청 체크
      const { data: existing } = await (supabase as any)
        .from('schedule_applications')
        .select('id')
        .eq('schedule_id', applyScheduleId)
        .eq('name', applyForm.name.trim())
        .eq('phone', applyForm.phone.trim())
        .maybeSingle()
      
      if (existing) {
        alert('이미 동일한 이름과 전화번호로 신청하셨습니다.')
        setApplySubmitting(false)
        return
      }
      
      await (supabase as any).from('schedule_applications').insert({
        schedule_id: applyScheduleId,
        name: applyForm.name.trim(),
        phone: applyForm.phone.trim(),
        kakao_id: applyForm.kakaoId?.trim() || null
      })
      
      // 신청자 수 즉시 업데이트
      setApplicationCounts(prev => ({
        ...prev,
        [applyScheduleId]: (prev[applyScheduleId] || 0) + 1
      }))
      
      setApplyStep(4) // 완료 화면
    } catch (error) {
      alert('신청에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setApplySubmitting(false)
    }
  }

  // 모달 닫기
  const closeApplyModal = () => {
    setShowApplyModal(false)
    setApplyStep(-1)
    setApplyForm({ name: '', phone: '', kakaoId: '' })
    setAgreeTerms(false)
    setAgreePrivacy(false)
    setApplyScheduleId(null)
  }

  // 오늘 하루 그만보기
  const hidePromoForToday = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    localStorage.setItem('frc_promo_hide_until', tomorrow.toISOString())
    setShowPromoModal(false)
  }

  // 홍보 모달에서 신청하기
  const handlePromoApply = (scheduleId: string) => {
    setShowPromoModal(false)
    openApplyModal(scheduleId)
  }

  return (
    <div className="min-h-screen bg-[#F6F7F9]">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="flex items-center justify-center px-4 h-14">
          <span className="text-base font-semibold text-slate-900">FRC SEOUL</span>
        </div>
      </header>

      {/* 스크롤 영역 */}
      <div className="pb-20">
        {/* 로딩 상태 */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        )}

        {!loading && (
          <>
        {/* 히어로 배너 */}
        <div className="bg-white px-4 pt-4 pb-6">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-tr from-[#1a1a2e] via-[#16213e] to-[#0f3460] h-52">
            <div className="absolute inset-0 flex">
              <div className="flex-1 flex flex-col justify-between p-5">
                <div>
                  <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-medium mb-2">
                    RUNNING CREW
                  </span>
                  <h1 className="text-3xl font-bold text-white leading-tight">
                    FRC_SEOUL
                  </h1>
                  <p className="text-sm text-white/70 mt-1">
                    Fun Running Crew
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-white/60">
                    함께 달리는 즐거움을 나누는 크루
                  </p>
                </div>
              </div>
              <div className="flex-1 relative">
                <Image
                  src="/frclogo/33.png"
                  alt="FRC Logo"
                  width={180}
                  height={180}
                  className="absolute -top-4 -right-4 opacity-90"
                />
              </div>
            </div>

            {/* 소셜 링크 */}
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <a 
                href="https://instagram.com/frc.seoul"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"
              >
                <Instagram className="w-4 h-4 text-white" />
              </a>
              <a 
                href="https://open.kakao.com/o/sgA84V4h"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"
              >
                <MessageCircle className="w-4 h-4 text-white" />
              </a>
            </div>
          </div>
        </div>

        {/* 크루 통계 */}
        <section className="bg-white mt-2 py-4">
          <div className="px-4 grid grid-cols-3 gap-2">
            {crewStatsData.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-1.5">
                  <stat.icon className="w-5 h-5 text-slate-700" />
                </div>
                <p className="text-sm font-bold text-slate-900">{stat.value}</p>
                <p className="text-[10px] text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 크루 소개 카드 */}
        <section className="mt-2 px-4 py-3">
          <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                <Image
                  src="/frclogo/4.png"
                  alt="FRC 로고"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm mb-1">우리 크루 소개</h3>
                <p className="text-white/70 text-[11px] leading-relaxed">
                  FRC는 2022년에 시작된 서울 기반 러닝 크루입니다. 물리치료사 크루장으로 구성되어 초보자부터 마라토너까지 누구나 환영하며, 건강하게 달리는 즐거움을 나눕니다.
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-white/60" />
                <span className="text-[11px] text-white/60">목표: 건강하게 함께 성장</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-white/60" />
                <span className="text-[11px] text-white/60">2026 서울마라톤 단체 하프 완주</span>
              </div>
            </div>
          </div>
        </section>

        {/* 탭 네비게이션 */}
        <section className="bg-white mt-2 pt-3">
          <div className="px-4 flex gap-2 border-b border-slate-100">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex-1 pb-3 text-[13px] font-semibold border-b-2 transition-colors ${
                activeTab === 'schedule'
                  ? 'text-slate-900 border-slate-900'
                  : 'text-slate-400 border-transparent'
              }`}
            >
              런닝 일정
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 pb-3 text-[13px] font-semibold border-b-2 transition-colors ${
                activeTab === 'members'
                  ? 'text-slate-900 border-slate-900'
                  : 'text-slate-400 border-transparent'
              }`}
            >
              멤버
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex-1 pb-3 text-[13px] font-semibold border-b-2 transition-colors ${
                activeTab === 'gallery'
                  ? 'text-slate-900 border-slate-900'
                  : 'text-slate-400 border-transparent'
              }`}
            >
              갤러리
            </button>
          </div>

          {/* 탭 콘텐츠 */}
          <div className="px-4 py-4">
            {/* 런닝 일정 탭 */}
            {activeTab === 'schedule' && (
              <div className="space-y-3">
                {/* 일정이 없을 때 */}
                {schedules.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10">
                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                      <Calendar className="w-7 h-7 text-slate-400" />
                    </div>
                    <p className="text-[13px] font-semibold text-slate-700">일정을 기획하고 있습니다!</p>
                    <p className="text-[11px] text-slate-400 mt-1">곧 새로운 런닝 일정이 등록될 예정이에요</p>
                  </div>
                )}

                {/* 정기 런닝 */}
                {schedules.filter((s) => s.is_regular && !s.is_completed).length > 0 && (
                <div className="mb-4">
                  <h3 className="text-[12px] font-semibold text-slate-500 mb-2">정기 런닝</h3>
                  {schedules
                    .filter((s) => s.is_regular && !s.is_completed)
                    .map((schedule) => (
                      <div
                        key={schedule.id}
                        onClick={() => openScheduleDetail(schedule)}
                        className="flex items-center gap-3 rounded-xl bg-[#F6F7F9] px-3 py-3 mb-2 cursor-pointer hover:bg-slate-200 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                          <Image
                            src="/frclogo/normal.png"
                            alt="정기 런닝"
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="inline-flex items-center rounded-full bg-slate-900 px-2 py-[2px] text-[9px] text-white font-medium">
                              정기
                            </span>
                            <span className="text-[10px] text-slate-500">{schedule.schedule_day ? `매주 ${schedule.schedule_day}` : schedule.schedule_date}</span>
                          </div>
                          <p className="text-[13px] font-semibold text-slate-900 truncate">
                            {schedule.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-500">
                              {schedule.time} · {schedule.location}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[12px] font-bold text-slate-900">{schedule.distance}</p>
                          <p className="text-[10px] text-slate-500">{schedule.pace}/km</p>
                          <p className="text-[9px] text-slate-500 mt-0.5">
                            자세히 보기
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
                )}

                {/* 특별 런닝 */}
                {schedules.filter((s) => !s.is_regular && !s.is_completed).length > 0 && (
                <div>
                  <h3 className="text-[12px] font-semibold text-slate-500 mb-2">특별 런닝</h3>
                  {schedules
                    .filter((s) => !s.is_regular && !s.is_completed)
                    .map((schedule) => (
                      <div
                        key={schedule.id}
                        onClick={() => openScheduleDetail(schedule)}
                        className="flex items-center gap-3 rounded-xl bg-[#F6F7F9] px-3 py-3 mb-2 cursor-pointer hover:bg-slate-200 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                          <Image
                            src="/frclogo/spacial.png"
                            alt="특별 런닝"
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="inline-flex items-center rounded-full bg-violet-600 px-2 py-[2px] text-[9px] text-white font-medium">
                              특별
                            </span>
                            <span className="text-[10px] text-slate-500">{schedule.schedule_date}</span>
                          </div>
                          <p className="text-[13px] font-semibold text-slate-900 truncate">
                            {schedule.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-500">
                              {schedule.time} · {schedule.location}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[12px] font-bold text-slate-900">{schedule.distance}</p>
                          <p className="text-[10px] text-slate-500">{schedule.pace}/km</p>
                          <p className="text-[9px] text-violet-600 mt-0.5">
                            자세히 보기
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
                )}

                {/* 끝난 런닝 */}
                {schedules.filter((s) => s.is_completed).length > 0 && (
                <div>
                  <h3 className="text-[12px] font-semibold text-slate-500 mb-2">끝난 런닝</h3>
                  {schedules
                    .filter((s) => s.is_completed)
                    .map((schedule) => (
                      <div
                        key={schedule.id}
                        className="flex items-center gap-3 rounded-xl bg-[#F6F7F9] px-3 py-3 mb-2 opacity-60"
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 grayscale">
                          <Image
                            src="/frclogo/normal.png"
                            alt="끝난 런닝"
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="inline-flex items-center rounded-full bg-slate-400 px-2 py-[2px] text-[9px] text-white font-medium">
                              완료
                            </span>
                            <span className="text-[10px] text-slate-500">{schedule.schedule_date || schedule.schedule_day}</span>
                          </div>
                          <p className="text-[13px] font-semibold text-slate-900 truncate">
                            {schedule.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-500">
                              {schedule.time} · {schedule.location}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[12px] font-bold text-slate-900">{schedule.distance}</p>
                          <p className="text-[10px] text-slate-500">{schedule.pace}/km</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            자세히 보기
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
                )}
              </div>
            )}

            {/* 멤버 탭 */}
            {activeTab === 'members' && (
              <div className="space-y-4">
                {/* 크루장 - 2열 그리드 */}
                {members.filter(m => m.role === '크루장').length > 0 && (
                  <div>
                    <h3 className="text-[12px] font-semibold text-slate-500 mb-2">크루장</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {members.filter(m => m.role === '크루장').map((member) => (
                        <div
                          key={member.id}
                          className={`flex flex-col items-center rounded-xl bg-[#F6F7F9] px-3 py-4 ${member.link_url ? 'cursor-pointer hover:bg-slate-200 transition-colors' : ''}`}
                          onClick={() => member.link_url && window.open(member.link_url, '_blank')}
                        >
                          <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-slate-300 to-slate-200 flex items-center justify-center overflow-hidden mb-2">
                            {member.profile_image ? (
                              <Image
                                src={member.profile_image}
                                alt={member.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <Users className="w-6 h-6 text-slate-600" />
                            )}
                          </div>
                          <p className="text-[13px] font-semibold text-slate-900">{member.name}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="inline-flex items-center rounded-full bg-slate-900 px-2 py-[1px] text-[9px] text-white font-medium">
                              크루장
                            </span>
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-[1px] text-[9px] text-blue-600 font-medium">
                              물리치료사
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">
                            {member.pace && `${member.pace}/km`}
                            {member.pace && member.main_distance && ' · '}
                            {member.main_distance}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 나머지 멤버 - 1열 리스트 */}
                {members.filter(m => m.role !== '크루장').length > 0 && (
                  <div>
                    <h3 className="text-[12px] font-semibold text-slate-500 mb-2">멤버</h3>
                    <div className="space-y-2">
                      {members.filter(m => m.role !== '크루장').map((member) => (
                        <div
                          key={member.id}
                          className={`flex items-center gap-3 rounded-xl bg-[#F6F7F9] px-3 py-3 ${member.link_url ? 'cursor-pointer hover:bg-slate-200 transition-colors' : ''}`}
                          onClick={() => member.link_url && window.open(member.link_url, '_blank')}
                        >
                          <div className="relative w-11 h-11 rounded-full bg-gradient-to-tr from-slate-300 to-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {member.profile_image ? (
                              <Image
                                src={member.profile_image}
                                alt={member.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <Users className="w-5 h-5 text-slate-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-[13px] font-semibold text-slate-900">{member.name}</p>
                              {member.role === '페이서' && (
                                <span className="inline-flex items-center rounded-full bg-violet-600 px-2 py-[1px] text-[9px] text-white font-medium">
                                  페이서
                                </span>
                              )}
                              {member.role === '그로워' && (
                                <span className="inline-flex items-center rounded-full bg-emerald-500 px-2 py-[1px] text-[9px] text-white font-medium">
                                  그로워
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {member.pace && `페이스 ${member.pace}/km`}
                              {member.pace && member.main_distance && ' · '}
                              {member.main_distance && `주력 ${member.main_distance}`}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 가입 안내 */}
                <div className="mt-4 rounded-2xl bg-gradient-to-r from-[#EEF0FF] to-[#F7F8FF] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[12px] font-semibold text-slate-900">
                        FRC에 함께하고 싶다면?
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        DM / 오픈채팅으로 문의해주세요
                      </p>
                    </div>
                    <button 
                      onClick={() => setShowContactModal(true)}
                      className="px-3 py-1.5 rounded-full bg-slate-900 text-white text-[11px] font-medium"
                    >
                      문의하기
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 갤러리 탭 */}
            {activeTab === 'gallery' && (
              <div>
                {/* 가로 슬라이드 갤러리 */}
                <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                  <div className="flex gap-2" style={{ width: 'max-content' }}>
                    {/* 2x2 그리드를 가로로 나열 */}
                    {Array.from({ length: Math.ceil(gallery.length / 4) }).map((_, groupIndex) => (
                      <div key={groupIndex} className="grid grid-cols-2 grid-rows-2 gap-1.5 flex-shrink-0" style={{ width: '280px', height: '280px' }}>
                        {gallery.slice(groupIndex * 4, groupIndex * 4 + 4).map((item) => (
                          <div
                            key={item.id}
                            className="rounded-lg overflow-hidden bg-slate-200 relative"
                          >
                            {item.image_url ? (
                              <Image
                                src={item.image_url}
                                alt={item.caption || '크루 활동 사진'}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-tr from-slate-300 to-slate-100" />
                            )}
                            {item.instagram_url && (
                              <a 
                                href={item.instagram_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 backdrop-blur flex items-center justify-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Instagram className="w-3 h-3 text-white" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 스크롤 힌트 */}
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  {Array.from({ length: Math.ceil(gallery.length / 4) }).map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  ))}
                </div>

                <p className="text-center text-[11px] text-slate-400 mt-2">
                  ← 좌우로 스와이프하여 더 보기 →
                </p>
              </div>
            )}
          </div>
        </section>

        {/* 다음 런닝 안내 - 자동 슬라이드 */}
        {upcomingSchedules.length > 0 && (
          <section className="mt-2 bg-white pt-4 pb-4">
            <div className="px-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[13px] font-semibold text-slate-900">다음 런닝</h2>
                {upcomingSchedules.length > 1 && (
                  <div className="flex items-center gap-1">
                    {upcomingSchedules.map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentSlide ? 'bg-slate-900' : 'bg-slate-300'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {/* 슬라이드 컨테이너 */}
              <div className="overflow-hidden">
                <div 
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {upcomingSchedules.map((schedule) => (
                    <div key={schedule.id} className="w-full flex-shrink-0 px-1">
                      <div 
                        onClick={() => openApplyModal(schedule.id)}
                        className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-4 cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-[2px] text-[9px] text-white font-medium mb-2">
                              {schedule.is_regular ? '정기' : ''} {schedule.schedule_date || schedule.schedule_day}
                            </span>
                            <h3 className="text-white font-bold text-base">{schedule.title}</h3>
                            <p className="text-white/60 text-[11px] mt-1">
                              {schedule.time} · {schedule.location}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-bold text-lg">{schedule.distance}</p>
                            <p className="text-white/60 text-[10px]">{schedule.pace}/km</p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-white/60" />
                            <span className="text-[11px] text-white/60">
                              {schedule.max_participants 
                                ? `${applicationCounts[schedule.id] || 0}/${schedule.max_participants}명`
                                : `${applicationCounts[schedule.id] || 0}명 참여 예정`
                              }
                            </span>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              openApplyModal(schedule.id)
                            }}
                            className="px-4 py-1.5 rounded-full bg-white text-slate-900 text-[11px] font-semibold"
                          >
                            참여하기
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 연락처 */}
        <section className="mt-2 bg-white pt-4 pb-6">
          <div className="px-4">
            <h2 className="text-[13px] font-semibold text-slate-900 mb-3">연락처</h2>
            <div className="space-y-2">
              <a
                href="https://instagram.com/frc.seoul"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl bg-[#F6F7F9] px-4 py-3"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center">
                  <Instagram className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-[12px] font-semibold text-slate-900">Instagram</p>
                  <p className="text-[11px] text-slate-500">@frc.seoul</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
              <a
                href="https://open.kakao.com/o/sgA84V4h"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl bg-[#F6F7F9] px-4 py-3"
              >
                <div className="w-10 h-10 rounded-full bg-[#FEE500] flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-[#3C1E1E]" />
                </div>
                <div className="flex-1">
                  <p className="text-[12px] font-semibold text-slate-900">카카오톡 오픈채팅</p>
                  <p className="text-[11px] text-slate-500">FRC 러닝크루</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
            </div>
          </div>
        </section>
          </>
        )}
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 safe-area-bottom">
        <button
          onClick={() => setShowDevModal(true)}
          className="w-full py-3 rounded-xl bg-slate-900 text-white text-[13px] font-semibold"
        >
          RunSpot에서 코스 둘러보기
        </button>
      </div>

      {/* 개발 중 안내 모달 */}
      {showDevModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-8 h-8 text-slate-700" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                현재 앱 개발 중입니다
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                더 나은 서비스를 위해 열심히 개발하고 있어요!
              </p>
              
              {/* 진행률 바 */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>개발 진행률</span>
                  <span className="font-semibold text-slate-900">75%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-slate-700 to-slate-900 h-2 rounded-full transition-all duration-500"
                    style={{ width: '75%' }}
                  />
                </div>
              </div>
              
              <p className="text-[11px] text-slate-400 mt-3">
                곧 만나요! 🏃‍♂️
              </p>
            </div>
            
            <div className="border-t border-slate-100 p-3">
              <button
                onClick={() => setShowDevModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-[13px] font-semibold"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 문의하기 모달 */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900">
                  FRC 가입 문의
                </h3>
                <button 
                  onClick={() => setShowContactModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
                >
                  <span className="text-slate-500 text-lg">×</span>
                </button>
              </div>

              {/* 입력 폼 */}
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-[11px] text-slate-500 mb-1 block">이름</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="이름을 입력해주세요"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 mb-1 block">인스타그램 ID 또는 연락처</label>
                  <input
                    type="text"
                    value={contactId}
                    onChange={(e) => setContactId(e.target.value)}
                    placeholder="@instagram 또는 010-0000-0000"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>

              {/* 생성된 메시지 */}
              <div className="rounded-xl bg-slate-50 p-3 mb-4">
                <p className="text-[11px] text-slate-500 mb-2">생성된 메시지</p>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <p className="text-[12px] text-slate-700 leading-relaxed">
                    "안녕하세요. 런닝 크루 가입하고 싶어요. 이름은 {contactName || 'OOO'}, 연락처 혹은 인스타그램 아이디 {contactId || 'OOO'}입니다."
                  </p>
                  <button
                    onClick={() => {
                      const message = `안녕하세요. 런닝 크루 가입하고 싶어요. 이름은 ${contactName || 'OOO'}, 연락처 혹은 인스타그램 아이디 ${contactId || 'OOO'}입니다.`
                      navigator.clipboard.writeText(message)
                    }}
                    className="mt-2 w-full py-1.5 rounded-md bg-slate-900 text-white text-[11px] font-medium hover:bg-slate-800 transition-colors"
                  >
                    복사하기
                  </button>
                </div>
              </div>

              {/* 안내 문구 */}
              <p className="text-[11px] text-slate-500 text-center mb-3">
                메시지를 복사해, DM 또는 오픈채팅방에 공유해 주세요!
              </p>

              {/* 연락처 목록 */}
              <div className="space-y-2">
                <a
                  href="https://instagram.com/frc.seoul"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl bg-[#F6F7F9] px-4 py-3"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center">
                    <Instagram className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[12px] font-semibold text-slate-900">Instagram DM</p>
                    <p className="text-[11px] text-slate-500">@frc.seoul</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </a>
                <a
                  href="https://open.kakao.com/o/sgA84V4h"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl bg-[#F6F7F9] px-4 py-3"
                >
                  <div className="w-10 h-10 rounded-full bg-[#FEE500] flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-[#3C1E1E]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[12px] font-semibold text-slate-900">카카오톡 오픈채팅</p>
                    <p className="text-[11px] text-slate-500">FRC 러닝크루</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </a>
              </div>
            </div>
            
            <div className="border-t border-slate-100 p-3">
              <button
                onClick={() => setShowContactModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 text-[13px] font-semibold"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 일정 상세 모달 */}
      {showScheduleDetail && selectedSchedule && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md overflow-hidden animate-in slide-in-from-bottom sm:fade-in sm:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* 헤더 이미지 영역 */}
            <div className="relative h-32 flex items-center justify-center bg-slate-900">
              <Image
                src="/frclogo/33.png"
                alt="FRC 로고"
                width={80}
                height={80}
                className="opacity-90"
              />
              <button
                onClick={() => setShowScheduleDetail(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center"
              >
                <span className="text-white text-lg">×</span>
              </button>
              <div className="absolute bottom-3 left-4">
                <span className="inline-flex items-center rounded-full bg-white/20 backdrop-blur px-2 py-1 text-[10px] text-white font-medium">
                  {selectedSchedule.is_regular ? '정기 런닝' : '특별 런닝'}
                </span>
              </div>
            </div>

            {/* 내용 */}
            <div className="p-5">
              <h2 className="text-xl font-bold text-slate-900 mb-1">{selectedSchedule.title}</h2>
              <p className="text-[12px] text-slate-500 mb-4">
                {selectedSchedule.is_regular 
                  ? `매주 ${selectedSchedule.schedule_day}` 
                  : selectedSchedule.schedule_date}
              </p>

              {/* 상세 정보 */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">시간</p>
                    <p className="text-[13px] font-semibold text-slate-900">{selectedSchedule.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">장소</p>
                    <p className="text-[13px] font-semibold text-slate-900">{selectedSchedule.location}</p>
                  </div>
                </div>
                {selectedSchedule.distance && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                      <Target className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500">거리</p>
                      <p className="text-[13px] font-semibold text-slate-900">{selectedSchedule.distance}</p>
                    </div>
                  </div>
                )}
                {selectedSchedule.pace && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500">페이스</p>
                      <p className="text-[13px] font-semibold text-slate-900">{selectedSchedule.pace}/km</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                    <Users className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">참여 인원</p>
                    <p className="text-[13px] font-semibold text-slate-900">
                      {selectedSchedule.max_participants 
                        ? `${applicationCounts[selectedSchedule.id] || 0}/${selectedSchedule.max_participants}명`
                        : `${applicationCounts[selectedSchedule.id] || 0}명`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* 설명 (있다면) */}
              {selectedSchedule.description && (
                <div className="mb-6 p-3 rounded-xl bg-slate-50">
                  <p className="text-[12px] text-slate-600 leading-relaxed">{selectedSchedule.description}</p>
                </div>
              )}

              {/* 버튼 */}
              {!selectedSchedule.is_completed && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowScheduleDetail(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-[13px] font-semibold"
                  >
                    닫기
                  </button>
                  <button
                    onClick={() => openApplyModal(selectedSchedule.id)}
                    className="flex-1 py-3 rounded-xl bg-violet-600 text-white text-[13px] font-semibold"
                  >
                    참여 신청
                  </button>
                </div>
              )}
              {selectedSchedule.is_completed && (
                <button
                  onClick={() => setShowScheduleDetail(false)}
                  className="w-full py-3 rounded-xl bg-slate-100 text-slate-600 text-[13px] font-semibold"
                >
                  닫기
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 런닝 신청 모달 */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* 단계 -1: 크루원/게스트 선택 */}
            {applyStep === -1 && (
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-slate-700" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">참여 유형 선택</h3>
                  <p className="text-[12px] text-slate-500 mt-1">크루원 또는 게스트를 선택해주세요</p>
                </div>

                <div className="space-y-3 mb-6">
                  {/* 크루원 */}
                  <button
                    onClick={handleCrewMemberSelect}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-slate-900 hover:bg-slate-50 transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-lg font-bold">C</span>
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-[14px] font-bold text-slate-900">크루원</p>
                      <p className="text-[11px] text-slate-500">FRC 정식 크루원이에요</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>

                  {/* 게스트 */}
                  <button
                    onClick={handleGuestSelect}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-violet-500 hover:bg-violet-50 transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-lg font-bold">G</span>
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-[14px] font-bold text-slate-900">게스트</p>
                      <p className="text-[11px] text-slate-500">처음 참여하는 게스트예요</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <button
                  onClick={closeApplyModal}
                  className="w-full py-3 rounded-xl bg-slate-100 text-slate-600 text-[13px] font-semibold"
                >
                  취소
                </button>
              </div>
            )}

            {/* 단계 0: 약관 동의 */}
            {applyStep === 0 && (
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-6 h-6 text-slate-700" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">약관 동의</h3>
                  <p className="text-[12px] text-slate-500 mt-1">서비스 이용을 위해 약관에 동의해주세요</p>
                </div>

                <div className="space-y-3 mb-6">
                  {/* 전체 동의 */}
                  <button
                    onClick={() => {
                      const allChecked = agreeTerms && agreePrivacy
                      setAgreeTerms(!allChecked)
                      setAgreePrivacy(!allChecked)
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      agreeTerms && agreePrivacy 
                        ? 'bg-slate-900 border-slate-900' 
                        : 'border-slate-300'
                    }`}>
                      {agreeTerms && agreePrivacy && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-[13px] font-semibold text-slate-900">전체 동의</span>
                  </button>

                  {/* 이용약관 */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
                    <button
                      onClick={() => setAgreeTerms(!agreeTerms)}
                      className="flex items-center gap-3"
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        agreeTerms 
                          ? 'bg-slate-900 border-slate-900' 
                          : 'border-slate-300'
                      }`}>
                        {agreeTerms && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-[13px] text-slate-700">[필수] 이용약관 동의</span>
                    </button>
                    <button 
                      onClick={() => setShowTermsDetail('terms')}
                      className="text-[11px] text-slate-400 underline"
                    >보기</button>
                  </div>

                  {/* 개인정보 수집 */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
                    <button
                      onClick={() => setAgreePrivacy(!agreePrivacy)}
                      className="flex items-center gap-3"
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        agreePrivacy 
                          ? 'bg-slate-900 border-slate-900' 
                          : 'border-slate-300'
                      }`}>
                        {agreePrivacy && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-[13px] text-slate-700">[필수] 개인정보 수집 및 이용 동의</span>
                    </button>
                    <button 
                      onClick={() => setShowTermsDetail('privacy')}
                      className="text-[11px] text-slate-400 underline"
                    >보기</button>
                  </div>
                </div>

                {/* 약관 상세 보기 */}
                {showTermsDetail && (
                  <div className="mb-4 p-4 rounded-xl bg-slate-50 border border-slate-200 max-h-48 overflow-y-auto">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[13px] font-semibold text-slate-900">
                        {showTermsDetail === 'terms' ? '이용약관' : '개인정보 수집 및 이용 동의'}
                      </h4>
                      <button 
                        onClick={() => setShowTermsDetail(null)}
                        className="text-[11px] text-slate-400"
                      >닫기</button>
                    </div>
                    {showTermsDetail === 'terms' ? (
                      <div className="text-[11px] text-slate-600 leading-relaxed space-y-2">
                        <p className="font-medium text-slate-700">제1조 (목적)</p>
                        <p>본 약관은 FRC SEOUL 러닝크루(이하 "크루")가 제공하는 런닝 프로그램 참여 서비스의 이용조건 및 절차에 관한 사항을 규정함을 목적으로 합니다.</p>
                        <p className="font-medium text-slate-700 pt-2">제2조 (참여자의 의무)</p>
                        <p>참여자는 런닝 중 본인의 안전에 책임을 지며, 크루의 안내사항을 준수해야 합니다.</p>
                        <p className="font-medium text-slate-700 pt-2">제3조 (면책사항)</p>
                        <p>크루는 참여자의 부주의로 인한 사고에 대해 책임을 지지 않습니다. 참여자는 본인의 건강 상태를 확인하고 참여해야 합니다.</p>
                        <p className="font-medium text-slate-700 pt-2">제4조 (참여 취소)</p>
                        <p>참여 취소는 런닝 시작 24시간 전까지 가능합니다.</p>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-600 leading-relaxed space-y-2">
                        <p className="font-medium text-slate-700">1. 수집하는 개인정보 항목</p>
                        <p>필수: 이름, 전화번호 / 선택: 카카오톡 ID</p>
                        <p className="font-medium text-slate-700 pt-2">2. 개인정보 수집 및 이용 목적</p>
                        <p>- 런닝 참여 신청 접수 및 확인<br />- 런닝 일정 안내 및 변경사항 공지<br />- 긴급 상황 시 연락</p>
                        <p className="font-medium text-slate-700 pt-2">3. 개인정보 보유 및 이용 기간</p>
                        <p>런닝 종료 후 1개월간 보관 후 파기</p>
                        <p className="font-medium text-slate-700 pt-2">4. 동의 거부권 및 불이익</p>
                        <p>개인정보 수집에 동의하지 않을 권리가 있으나, 동의 거부 시 런닝 참여 신청이 불가합니다.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 수집 항목 안내 */}
                <div className="p-3 rounded-xl bg-slate-50 mb-6">
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    <span className="font-medium text-slate-700">수집 항목:</span> 이름, 전화번호, 카카오톡 ID(선택)<br />
                    <span className="font-medium text-slate-700">수집 목적:</span> 런닝 참여 신청 및 안내<br />
                    <span className="font-medium text-slate-700">보유 기간:</span> 런닝 종료 후 1개월
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={closeApplyModal}
                    className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-[13px] font-semibold"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleApplyNext}
                    disabled={!agreeTerms || !agreePrivacy}
                    className="flex-1 py-3 rounded-xl bg-slate-900 text-white text-[13px] font-semibold disabled:opacity-50"
                  >
                    동의하고 계속
                  </button>
                </div>
              </div>
            )}

            {/* 단계 1: 이름 입력 */}
            {applyStep === 1 && (
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-3 h-3 rounded-full bg-slate-900 mx-auto mb-4" />
                  <p className="text-[11px] text-slate-400 mb-1">1 / 3</p>
                  <h3 className="text-lg font-bold text-slate-900">이름을 알려주세요</h3>
                </div>
                <input
                  type="text"
                  value={applyForm.name}
                  onChange={(e) => setApplyForm({ ...applyForm, name: e.target.value })}
                  placeholder="이름"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center text-[15px] focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                      e.preventDefault()
                      handleApplyNext()
                    }
                  }}
                />
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={closeApplyModal}
                    className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-[13px] font-semibold"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleApplyNext}
                    disabled={!applyForm.name.trim()}
                    className="flex-1 py-3 rounded-xl bg-slate-900 text-white text-[13px] font-semibold disabled:opacity-50"
                  >
                    다음
                  </button>
                </div>
              </div>
            )}

            {/* 단계 2: 전화번호 입력 */}
            {applyStep === 2 && (
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-3 h-3 rounded-full bg-slate-900 mx-auto mb-4" />
                  <p className="text-[11px] text-slate-400 mb-1">2 / 3</p>
                  <h3 className="text-lg font-bold text-slate-900">전화번호를 알려주세요</h3>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={applyForm.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    setApplyForm({ ...applyForm, phone: value })
                  }}
                  placeholder="01012341234"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center text-[15px] focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                      e.preventDefault()
                      handleApplyNext()
                    }
                  }}
                />
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => setApplyStep(1)}
                    className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-[13px] font-semibold"
                  >
                    이전
                  </button>
                  <button
                    onClick={handleApplyNext}
                    disabled={!applyForm.phone.trim()}
                    className="flex-1 py-3 rounded-xl bg-slate-900 text-white text-[13px] font-semibold disabled:opacity-50"
                  >
                    다음
                  </button>
                </div>
              </div>
            )}

            {/* 단계 3: 카카오톡 ID (선택) */}
            {applyStep === 3 && (
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-3 h-3 rounded-full bg-slate-900 mx-auto mb-4" />
                  <p className="text-[11px] text-slate-400 mb-1">3 / 3</p>
                  <h3 className="text-lg font-bold text-slate-900">카카오톡 ID</h3>
                  <p className="text-[12px] text-slate-500 mt-1">카톡이 비공개인 경우에만 입력해주세요</p>
                </div>
                <input
                  type="text"
                  value={applyForm.kakaoId}
                  onChange={(e) => setApplyForm({ ...applyForm, kakaoId: e.target.value })}
                  placeholder="선택사항"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center text-[15px] focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                      e.preventDefault()
                      handleApplyNext()
                    }
                  }}
                />
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => setApplyStep(2)}
                    className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-[13px] font-semibold"
                  >
                    이전
                  </button>
                  <button
                    onClick={handleApplyNext}
                    disabled={applySubmitting}
                    className="flex-1 py-3 rounded-xl bg-slate-900 text-white text-[13px] font-semibold disabled:opacity-50"
                  >
                    {applySubmitting ? '신청 중...' : '신청하기'}
                  </button>
                </div>
              </div>
            )}

            {/* 단계 4: 완료 */}
            {applyStep === 4 && (
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">신청 완료!</h3>
                <p className="text-[13px] text-slate-500 mb-6">
                  {applyForm.name}님, 신청이 완료되었습니다.<br />
                  곧 연락드릴게요! 🏃‍♂️
                </p>
                <button
                  onClick={closeApplyModal}
                  className="w-full py-3 rounded-xl bg-slate-900 text-white text-[13px] font-semibold"
                >
                  확인
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 크루원 안내 모달 */}
      {showCrewNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">크루원 참여 안내</h3>
              <p className="text-[13px] text-slate-500 mb-4">
                크루원은 카카오톡 오픈채팅방의<br />
                <span className="font-semibold text-slate-700">공지사항</span>을 확인해주세요!
              </p>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 mb-6">
                <p className="text-[12px] text-amber-700">
                  📢 런닝 일정 및 참여 방법은<br />
                  오픈채팅방 공지에서 확인하실 수 있습니다.
                </p>
              </div>
              <button
                onClick={() => setShowCrewNoticeModal(false)}
                className="w-full py-3 rounded-xl bg-slate-900 text-white text-[13px] font-semibold"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 홍보 팝업 모달 */}
      {showPromoModal && upcomingSchedules.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* 헤더 */}
            <div className="relative bg-slate-900 p-5 text-center">
              <button
                onClick={() => setShowPromoModal(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
              >
                <span className="text-white text-lg">×</span>
              </button>
              <Image
                src="/frclogo/33.png"
                alt="FRC 로고"
                width={60}
                height={60}
                className="mx-auto mb-2"
              />
              <h3 className="text-white font-bold text-lg">다가오는 런닝</h3>
              <p className="text-white/60 text-[11px] mt-1">FRC와 함께 달려요!</p>
            </div>

            {/* 런닝 목록 */}
            <div className="p-4 max-h-[300px] overflow-y-auto">
              <div className="space-y-3">
                {upcomingSchedules.slice(0, 3).map((schedule) => (
                  <div 
                    key={schedule.id}
                    onClick={() => handlePromoApply(schedule.id)}
                    className="rounded-xl bg-slate-50 p-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center rounded-full px-2 py-[2px] text-[9px] font-medium ${
                            schedule.is_regular 
                              ? 'bg-slate-900 text-white' 
                              : 'bg-violet-600 text-white'
                          }`}>
                            {schedule.is_regular ? '정기' : '특별'}
                          </span>
                          <span className="text-[10px] text-slate-500">{schedule.schedule_date}</span>
                        </div>
                        <p className="text-[13px] font-semibold text-slate-900">{schedule.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {schedule.time} · {schedule.location}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-[14px] font-bold text-slate-900">{schedule.distance}</p>
                        <p className="text-[10px] text-slate-500">{schedule.pace}/km</p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] text-slate-500">
                          {schedule.max_participants 
                            ? `${applicationCounts[schedule.id] || 0}/${schedule.max_participants}명`
                            : `${applicationCounts[schedule.id] || 0}명`
                          }
                        </span>
                      </div>
                      <span className="text-[10px] text-violet-600 font-medium">신청하기 →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="p-4 pt-0 space-y-2">
              <button
                onClick={() => setShowPromoModal(false)}
                className="w-full py-3 rounded-xl bg-slate-900 text-white text-[13px] font-semibold"
              >
                확인
              </button>
              <button
                onClick={hidePromoForToday}
                className="w-full py-2 text-[11px] text-slate-400"
              >
                오늘 하루 그만보기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

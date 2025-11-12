'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Edit3, MapPin, Clock, Trophy, Target, Loader2, Camera, Image as ImageIcon, X, Check, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getUserProfile, formatTime } from '@/lib/profile'
import { getCurrentUser, signOut } from '@/lib/auth'
import { calculateRunningStats, type UserRunningStats } from '@/lib/runningStats'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [runningStats, setRunningStats] = useState<UserRunningStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [updatingName, setUpdatingName] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    loadProfileData()
  }, [])

  const loadProfileData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 현재 사용자 정보 가져오기
      const user = await getCurrentUser()
      const isGuestMode = typeof window !== 'undefined' && localStorage.getItem('runspot_guest_mode') === 'true'
      
      if (!user && !isGuestMode) {
        setIsAuthenticated(false)
        setError('로그인이 필요합니다.')
        return
      }

      if (!user && isGuestMode) {
        setIsAuthenticated(false)
        setError('프로필 기능을 사용하려면 로그인이 필요합니다.')
        return
      }

      setIsAuthenticated(true)

      setUserId(user.id)

      // 프로필 정보와 런닝 통계를 병렬로 가져오기
      const [profileData, statsData] = await Promise.all([
        getUserProfile(user.id),
        calculateRunningStats(user.id)
      ])
      
      setProfile(profileData)
      setRunningStats(statsData)
      
      // 프로필 이미지 설정
      if (profileData && (profileData as any).profile_image) {
        setProfileImage((profileData as any).profile_image)
        console.log('프로필 이미지 로드됨:', (profileData as any).profile_image)
      } else {
        console.log('프로필 이미지 없음')
      }
      
      // 편집된 이름 초기화
      if (profileData) {
        setEditedName((profileData as any).name || '사용자')
      }
    } catch (err) {
      console.error('프로필 데이터 로드 실패:', err)
      setError('프로필 정보를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUploadNew = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !userId) return

    // 파일 크기 체크 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.')
      return
    }

    // 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.')
      return
    }

    setUploadingImage(true)
    
    try {
      // 항상 Supabase Storage 업로드 시도
      console.log('스토리지 업로드 시작...')
      const uploadedUrl = await uploadToStorage(file)
      console.log('스토리지 업로드 성공:', uploadedUrl)
      setProfileImage(uploadedUrl)
      
      // 사용자 프로필에 이미지 URL 업데이트
      console.log('업데이트 시도:', { userId, uploadedUrl })
      
      const { data: updateData, error: updateError } = await (supabase as any)
        .from('users')
        .update({ profile_image: uploadedUrl })
        .eq('id', userId)
        .select()
      
      console.log('업데이트 결과:', { updateData, updateError })
      
      if (updateError) {
        console.error('프로필 업데이트 실패:', updateError)
        throw updateError
      }
      
      // 프로필 데이터 다시 로드
      await loadProfileData()
      
      alert('프로필 이미지가 업데이트되었습니다!')
    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      alert('이미지 업로드에 실패했습니다.')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleImageClick = () => {
    setShowImageModal(true)
  }

  const handleGallerySelect = () => {
    setShowImageModal(false)
    fileInputRef.current?.click()
  }

  const handleCameraSelect = () => {
    setShowImageModal(false)
    cameraInputRef.current?.click()
  }

  // 닉네임 수정 시작
  const handleEditName = () => {
    setIsEditingName(true)
    setEditedName(profile?.name || '사용자')
  }

  // 닉네임 수정 취소
  const handleCancelEditName = () => {
    setIsEditingName(false)
    setEditedName(profile?.name || '사용자')
  }

  // 닉네임 업데이트
  const handleUpdateName = async () => {
    if (!userId || !editedName.trim()) return

    setUpdatingName(true)
    
    try {
      const { data, error } = await (supabase as any)
        .from('users')
        .update({ name: editedName.trim() })
        .eq('id', userId)
        .select()

      if (error) {
        console.error('닉네임 업데이트 실패:', error)
        alert('닉네임 업데이트에 실패했습니다.')
        return
      }

      // 프로필 데이터 다시 로드
      await loadProfileData()
      setIsEditingName(false)
      alert('닉네임이 업데이트되었습니다!')
    } catch (error) {
      console.error('닉네임 업데이트 오류:', error)
      alert('닉네임 업데이트 중 오류가 발생했습니다.')
    } finally {
      setUpdatingName(false)
    }
  }

  // 로그아웃 처리
  const handleSignOut = async () => {
    if (!confirm('정말 로그아웃하시겠습니까?')) return

    try {
      const result = await signOut()
      if (result.success) {
        alert('로그아웃되었습니다.')
        router.push('/login') // 로그인 페이지로 이동
      } else {
        alert(result.error || '로그아웃에 실패했습니다.')
      }
    } catch (error) {
      console.error('로그아웃 오류:', error)
      alert('로그아웃 중 오류가 발생했습니다.')
    }
  }

  // Supabase Storage 업로드 함수
  const uploadToStorage = async (file: File): Promise<string> => {
    const fileName = `avatar_${Date.now()}.${file.name.split('.').pop()}`
    const filePath = `profiles/${userId}/${fileName}`
    
    console.log('업로드 정보:', { fileName, filePath, fileSize: file.size, fileType: file.type })
    
    const { data, error } = await supabase.storage
      .from('profile-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })
    
    console.log('업로드 응답:', { data, error })
    
    if (error) {
      console.error('Storage upload error:', error)
      throw error
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('profile-images')
      .getPublicUrl(filePath)
    
    console.log('Public URL 생성:', publicUrl)
    
    return publicUrl
  }

  // 레벨별 색상 반환
  const getLevelColor = (level: string) => {
    switch (level) {
      case '입문': return 'text-gray-400'
      case '중급': return 'text-blue-400'
      case '고급': return 'text-purple-400'
      case '마스터': return 'text-yellow-400'
      case '국가대표': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  // 레벨별 설명 반환
  const getLevelDescription = (level: string) => {
    switch (level) {
      case '입문': return '런닝을 시작하는 단계입니다'
      case '중급': return '꾸준한 런닝으로 체력이 향상되었습니다'
      case '고급': return '이제 진정한 러너입니다'
      case '마스터': return '마스터 러너입니다!'
      case '국가대표': return '국가대표급 실력입니다!'
      default: return '런닝을 시작해보세요'
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 상단 헤더 */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-800 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">프로필</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* 로딩 상태 */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#00FF88]" />
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="text-center py-12">
            <div className="mb-6">
              <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-red-400 mb-2">{error}</p>
              <p className="text-gray-500 text-sm">계정에 로그인하여 프로필을 확인하세요</p>
            </div>
            
            {isAuthenticated === false ? (
              <button 
                onClick={() => router.push('/login')}
                className="bg-[#00FF88] text-black px-6 py-3 rounded-xl font-semibold hover:bg-[#00E077] transition-colors"
              >
                로그인 하기
              </button>
            ) : (
              <button 
                onClick={loadProfileData}
                className="bg-[#00FF88] text-black px-4 py-2 rounded-xl font-semibold hover:bg-[#00E077] transition-colors"
              >
                다시 시도
              </button>
            )}
          </div>
        )}

        {/* 프로필 정보 */}
        {!loading && !error && (
          <>
            <div className="text-center">
              <div className="relative">
                <div 
                  className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 neon-glow cursor-pointer group overflow-hidden"
                  onClick={handleImageClick}
                >
                  {profileImage ? (
                    <Image
                      src={profileImage}
                      alt="프로필 이미지"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#00FF88] rounded-full flex items-center justify-center">
                      <span className="text-3xl font-bold text-black">
                        {profile?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                  
                  {/* 호버 오버레이 */}
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploadingImage ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                  </div>
                </div>
                
                {/* 숨겨진 파일 입력 */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUploadNew}
                  className="hidden"
                />
                {/* 카메라 입력 */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUploadNew}
                  className="hidden"
                />
              </div>
              
              {isEditingName ? (
                <div className="relative mb-1">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdateName()
                      } else if (e.key === 'Escape') {
                        handleCancelEditName()
                      }
                    }}
                    className="w-full text-xl font-bold text-white bg-gray-800 border border-gray-600 rounded-lg px-3 py-1 text-center focus:outline-none focus:border-[#00FF88] transition-colors"
                    placeholder="닉네임을 입력하세요"
                    maxLength={20}
                    autoFocus
                  />
                  <div className="absolute top-1/2 -translate-y-1/2 right-4 flex gap-1">
                    <button
                      onClick={handleUpdateName}
                      disabled={updatingName || !editedName.trim()}
                      className="p-1 bg-[#00FF88] text-black rounded-lg hover:bg-[#00E077] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingName ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={handleCancelEditName}
                      className="p-1 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative mb-1">
                  <h2 className="text-xl font-bold text-white text-center">
                    {profile?.name || '사용자'}
                  </h2>
                  <button
                    onClick={handleEditName}
                    className="absolute top-1/2 -translate-y-1/2 left-1/2 translate-x-16 opacity-40 hover:opacity-100 transition-opacity p-1 hover:bg-gray-800/50 rounded-lg"
                  >
                    <Edit3 className="w-4 h-4 text-gray-400 hover:text-white transition-colors" />
                  </button>
                </div>
              )}
              <div className="text-center">
                <p className={`text-lg font-semibold ${getLevelColor(runningStats?.currentLevel || '입문')}`}>
                  {runningStats?.currentLevel || '입문'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {getLevelDescription(runningStats?.currentLevel || '입문')}
                </p>
              </div>
            </div>

            {/* 런닝 통계 */}
            <div className="bg-gray-900/80 glass rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold mb-4 text-center">런닝 통계</h3>
              
              {runningStats ? (
                <div className="grid grid-cols-2 gap-4">
                  {/* 총 거리 */}
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <MapPin className="w-5 h-5 text-[#00FF88] mr-2" />
                      <span className="text-sm text-gray-400">총 거리</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{runningStats.totalDistance}km</p>
                  </div>

                  {/* 총 런닝 횟수 */}
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Trophy className="w-5 h-5 text-[#00FF88] mr-2" />
                      <span className="text-sm text-gray-400">총 런닝</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{runningStats.totalRuns}회</p>
                  </div>

                  {/* 총 시간 */}
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="w-5 h-5 text-[#00FF88] mr-2" />
                      <span className="text-sm text-gray-400">총 시간</span>
                    </div>
                    <p className="text-lg font-bold text-white">{formatTime(runningStats.totalTime)}</p>
                  </div>

                  {/* 평균 페이스 */}
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Target className="w-5 h-5 text-[#00FF88] mr-2" />
                      <span className="text-sm text-gray-400">평균 페이스</span>
                    </div>
                    <p className="text-lg font-bold text-white">{runningStats.averagePace > 0 ? `${runningStats.averagePace.toFixed(1)}분/km` : '-'}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">런닝 기록이 없습니다.</p>
                  <p className="text-sm text-gray-500 mt-2">첫 런닝을 시작해보세요!</p>
                </div>
              )}
            </div>

            {/* 레벨 진행도 */}
            <div className="bg-gray-900/80 glass rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold mb-4">레벨 진행도</h3>
              
              {runningStats ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-semibold ${getLevelColor(runningStats.currentLevel)}`}>
                      {runningStats.currentLevel}
                    </span>
                    <span className="text-sm text-[#00FF88]">
                      {runningStats.totalDistance}km / {runningStats.nextLevelTarget === Infinity ? '∞' : runningStats.nextLevelTarget}km
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                    <div 
                      className="bg-gradient-to-r from-[#00FF88] to-[#00E077] h-3 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${runningStats.levelProgress}%` 
                      }}
                    ></div>
                  </div>
                  
                  <p className="text-xs text-gray-400 text-center">
                    {runningStats.levelProgress < 100 
                      ? `다음 레벨까지 ${Math.max(runningStats.nextLevelTarget - runningStats.totalDistance, 0)}km 남았습니다`
                      : runningStats.currentLevel === '마스터'
                        ? '마스터 레벨에 도달했습니다! 국가대표는 인증이 필요합니다.'
                        : '최고 레벨에 도달했습니다!'
                    }
                  </p>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-400">레벨 정보가 없습니다.</p>
                </div>
              )}
            </div>


            {/* 설정 메뉴 */}
            <div className="bg-gray-900/80 glass rounded-2xl border border-gray-800 overflow-hidden">
              <button 
                onClick={() => router.push('/profile/notifications')}
                className="w-full px-6 py-4 text-left hover:bg-gray-800/50 transition-colors border-b border-gray-800"
              >
                <span className="text-white">알림 설정</span>
              </button>
              <button 
                onClick={() => router.push('/profile/privacy')}
                className="w-full px-6 py-4 text-left hover:bg-gray-800/50 transition-colors border-b border-gray-800"
              >
                <span className="text-white">개인정보 설정</span>
              </button>
              <button 
                onClick={() => router.push('/profile/about')}
                className="w-full px-6 py-4 text-left hover:bg-gray-800/50 transition-colors border-b border-gray-800"
              >
                <span className="text-white">앱 정보</span>
              </button>
              <button 
                onClick={handleSignOut}
                className="w-full px-6 py-4 text-left hover:bg-gray-800/50 transition-colors text-red-400"
              >
                <span>로그아웃</span>
              </button>
            </div>

            {/* 하단 여백 */}
            <div className="h-20"></div>
          </>
        )}
      </div>

      {/* 이미지 선택 모달 */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-t-2xl w-full max-w-md border-t border-gray-800 animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold text-white">프로필 이미지 변경</h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="p-2 hover:bg-gray-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              <button
                onClick={handleCameraSelect}
                className="w-full flex items-center gap-3 p-4 bg-gray-800/50 hover:bg-gray-800 rounded-xl transition-colors"
              >
                <Camera className="w-6 h-6 text-[#00FF88]" />
                <div className="text-left">
                  <p className="text-white font-medium">카메라로 촬영</p>
                  <p className="text-sm text-gray-400">새로운 사진을 촬영합니다</p>
                </div>
              </button>
              
              <button
                onClick={handleGallerySelect}
                className="w-full flex items-center gap-3 p-4 bg-gray-800/50 hover:bg-gray-800 rounded-xl transition-colors"
              >
                <ImageIcon className="w-6 h-6 text-[#00FF88]" />
                <div className="text-left">
                  <p className="text-white font-medium">갤러리에서 선택</p>
                  <p className="text-sm text-gray-400">기존 사진을 선택합니다</p>
                </div>
              </button>
            </div>
            
            <div className="p-4">
              <button
                onClick={() => setShowImageModal(false)}
                className="w-full py-3 text-gray-400 hover:text-white transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

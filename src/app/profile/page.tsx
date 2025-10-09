'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Edit3, MapPin, Clock, Trophy, Target, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getUserProfile, getUserRecentActivities, formatTime, formatPace, formatRelativeDate } from '@/lib/profile'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 임시 사용자 ID (실제로는 auth에서 가져와야 함)
  const userId = '550e8400-e29b-41d4-a716-446655440001'

  useEffect(() => {
    loadProfileData()
  }, [])

  const loadProfileData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 프로필 정보와 최근 활동을 병렬로 가져오기
      const [profileData, activitiesData] = await Promise.all([
        getUserProfile(userId),
        getUserRecentActivities(userId, 3)
      ])

      setProfile(profileData)
      setRecentActivities(activitiesData)
    } catch (err) {
      console.error('프로필 데이터 로드 실패:', err)
      setError('프로필 정보를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
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
          <button className="p-2 hover:bg-gray-800 rounded-xl transition-colors">
            <Edit3 className="w-6 h-6" />
          </button>
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
            <p className="text-red-400 mb-4">{error}</p>
            <button 
              onClick={loadProfileData}
              className="bg-[#00FF88] text-black px-4 py-2 rounded-xl font-semibold hover:bg-[#00E077] transition-colors"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 프로필 정보 */}
        {!loading && !error && (
          <>
            <div className="text-center">
              <div className="w-24 h-24 bg-[#00FF88] rounded-full flex items-center justify-center mx-auto mb-4 neon-glow">
                <span className="text-3xl font-bold text-black">
                  {profile?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">
                {profile?.name || '사용자'}
              </h2>
              <p className="text-gray-400">{profile?.current_level || '입문 러너'}</p>
            </div>

            {/* 런닝 통계 */}
            <div className="bg-gray-900/80 glass rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold mb-4 text-center">런닝 통계</h3>
              
              {profile ? (
                <div className="grid grid-cols-2 gap-4">
                  {/* 총 거리 */}
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <MapPin className="w-5 h-5 text-[#00FF88] mr-2" />
                      <span className="text-sm text-gray-400">총 거리</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{profile.total_distance || 0}km</p>
                  </div>

                  {/* 총 런닝 횟수 */}
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Trophy className="w-5 h-5 text-[#00FF88] mr-2" />
                      <span className="text-sm text-gray-400">총 런닝</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{profile.total_runs || 0}회</p>
                  </div>

                  {/* 총 시간 */}
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="w-5 h-5 text-[#00FF88] mr-2" />
                      <span className="text-sm text-gray-400">총 시간</span>
                    </div>
                    <p className="text-lg font-bold text-white">{formatTime(profile.total_time || 0)}</p>
                  </div>

                  {/* 평균 페이스 */}
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Target className="w-5 h-5 text-[#00FF88] mr-2" />
                      <span className="text-sm text-gray-400">평균 페이스</span>
                    </div>
                    <p className="text-lg font-bold text-white">{formatPace(profile.avg_pace || 0)}/km</p>
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
              
              {profile ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">{profile.current_level}</span>
                    <span className="text-sm text-[#00FF88]">
                      {profile.total_distance}km / {profile.next_level_target}km
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                    <div 
                      className="bg-gradient-to-r from-[#00FF88] to-[#00E077] h-3 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min((profile.total_distance / profile.next_level_target) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                  
                  <p className="text-xs text-gray-400 text-center">
                    다음 레벨까지 {Math.max(profile.next_level_target - profile.total_distance, 0)}km 남았습니다
                  </p>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-400">레벨 정보가 없습니다.</p>
                </div>
              )}
            </div>

            {/* 최근 활동 */}
            <div className="bg-gray-900/80 glass rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold mb-4">최근 활동</h3>
              
              {recentActivities.length > 0 ? (
                <div className="space-y-3">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-white font-medium">
                          {activity.courses?.name || '알 수 없는 코스'}
                        </p>
                        <p className="text-sm text-gray-400">
                          {formatRelativeDate(activity.created_at)} • {activity.distance}km • {Math.round(activity.duration / 60)}분
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#00FF88] font-semibold">완주</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">최근 활동이 없습니다.</p>
                  <p className="text-sm text-gray-500 mt-2">런닝을 시작해보세요!</p>
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
                onClick={() => {
                  if (confirm('정말 로그아웃하시겠습니까?')) {
                    // TODO: 실제 로그아웃 로직 구현
                    alert('로그아웃되었습니다.')
                    router.push('/')
                  }
                }}
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
    </div>
  )
}


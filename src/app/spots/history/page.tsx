'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, History, Coffee, Utensils, ShoppingBag, Heart, MapPin, Calendar, Clock, CheckCircle, X, Timer } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getUserCouponHistory, cleanupExpiredCoupons } from '@/lib/spots'
import { getGuestUserId } from '@/lib/auth'

export default function SpotHistoryPage() {
  const router = useRouter()
  const [couponHistory, setCouponHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>('')
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    setUserId(getGuestUserId())
  }, [])

  useEffect(() => {
    if (userId) {
      loadCouponHistory()
    }
  }, [userId])

  // 실시간 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const loadCouponHistory = async () => {
    setLoading(true)
    try {
      const history = await getUserCouponHistory(userId, 50) // 최근 50개
      setCouponHistory(history)
    } catch (error) {
      console.error('쿠폰 이력 로딩 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  // 쿠폰 클릭 핸들러
  const handleCouponClick = (coupon: any) => {
    // 활성 쿠폰만 모달로 표시
    if (coupon.status === 'active') {
      setSelectedCoupon(coupon)
      setShowCouponModal(true)
    }
  }

  // 남은 시간 계산
  const getRemainingTime = (expiresAt: string) => {
    const remaining = new Date(expiresAt).getTime() - currentTime.getTime()
    
    if (remaining <= 0) return '만료됨'
    
    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000)
    
    return `${hours}시간 ${minutes}분 ${seconds}초`
  }

  // 쿠폰 유효성 확인
  const isCouponValid = (coupon: any) => {
    if (!coupon || coupon.status !== 'active') return false
    const expiryDate = new Date(coupon.expired_at)
    return currentTime < expiryDate
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cafe': return <Coffee className="w-4 h-4" />
      case 'restaurant': return <Utensils className="w-4 h-4" />
      case 'shop': return <ShoppingBag className="w-4 h-4" />
      case 'fitness': return <Heart className="w-4 h-4" />
      default: return <MapPin className="w-4 h-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'used':
        return (
          <div className="text-[#00FF88] text-sm font-medium">
            사용완료
          </div>
        )
      case 'expired':
        return (
          <div className="text-gray-400 text-sm font-medium">
            만료됨
          </div>
        )
      case 'active':
        return (
          <div className="text-[#00FF88] text-sm font-medium">
            인증완료
          </div>
        )
      default:
        return (
          <div className="text-gray-400 text-sm font-medium">
            인증완료
          </div>
        )
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
          <h1 className="text-lg font-semibold">인증 완료 내역</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* 헤더 섹션 */}
        <div className="text-center">
          <div className="w-16 h-16 bg-[#00FF88] rounded-full flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8 text-black" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">인증 완료 내역</h2>
          <p className="text-gray-400">스팟에서 완주 인증한 모든 기록을 확인하세요</p>
        </div>


        {/* 히스토리 목록 */}
        <div>
          {loading ? (
            // 로딩 스켈레톤
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="bg-gray-900/80 rounded-2xl p-4 border border-gray-800 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-700 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-700 rounded mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    </div>
                    <div className="w-16 h-6 bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : couponHistory.length > 0 ? (
            <div className="space-y-4">
              {couponHistory.map((history, index) => (
                <div 
                  key={index} 
                  onClick={() => handleCouponClick(history)}
                  className={`bg-gray-900/80 glass rounded-2xl p-4 border border-gray-800 hover:border-gray-700 transition-all duration-300 animate-fade-in-up ${
                    history.status === 'active' ? 'cursor-pointer hover:bg-gray-800/60' : 'cursor-default'
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{history.spots?.name || '알 수 없는 스팟'}</h3>
                      <p className="text-sm text-gray-400">{history.spots?.signature_menu}</p>
                    </div>
                    {getStatusBadge(history.status)}
                  </div>

                  <div className="bg-gray-800/50 rounded-xl p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">혜택</span>
                      <span className="text-[#00FF88] font-medium">{history.discount_info}</span>
                    </div>
                    {history.status === 'active' && (
                      <div className="text-center">
                        <p className="text-xs text-gray-400 mb-1">유효시간</p>
                        <p className="text-[#00FF88] font-bold text-lg">
                          {getRemainingTime(history.expired_at)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        발급일시
                      </span>
                      <span className="text-gray-300">
                        {new Date(history.issued_at || history.created_at).toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    
                    {history.used_at && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          사용일시
                        </span>
                        <span className="text-[#00FF88]">
                          {new Date(history.used_at).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        만료일시
                      </span>
                      <span className="text-gray-300">
                        {new Date(history.expired_at).toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // 빈 상태
            <div className="text-center py-12">
              <History className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">
                인증 완료 내역이 없습니다
              </h3>
              <p className="text-gray-500 mb-6">
                스팟에서 완주 인증을 해보세요!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 하단 여백 */}
      <div className="h-20"></div>

      {/* 쿠폰 모달 */}
      {showCouponModal && selectedCoupon && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-3xl p-6 max-w-sm w-full border border-gray-800 relative overflow-hidden">
            {/* 배경 패턴 */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#00FF88] to-transparent"></div>
            </div>
            
            {/* 닫기 버튼 */}
            <button 
              onClick={() => setShowCouponModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-800 rounded-xl transition-colors z-50"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            <div className="relative z-10">
              {isCouponValid(selectedCoupon) ? (
                <>
                  {/* 성공 아이콘 */}
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-[#00FF88] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <CheckCircle className="w-8 h-8 text-black" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">인증 완료!</h3>
                    <p className="text-gray-400 text-sm">완주 인증이 성공적으로 완료되었습니다</p>
                  </div>

                  {/* 쿠폰 정보 */}
                  <div className="bg-gradient-to-r from-[#00FF88]/20 to-[#00FF88]/10 border border-[#00FF88]/30 rounded-2xl p-4 mb-4">
                    <div className="text-center">
                      <h4 className="text-lg font-semibold text-white mb-1">{selectedCoupon.spots?.name}</h4>
                      <p className="text-[#00FF88] font-medium text-lg mb-3">{selectedCoupon.discount_info}</p>
                      
                      {/* 유효시간 강조 */}
                      <div className="bg-black/30 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-gray-400">발급일시</p>
                          <p className="text-xs text-white">
                            {new Date(selectedCoupon.issued_at || selectedCoupon.created_at).toLocaleString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs text-gray-400">만료시간</p>
                          <p className="text-xs text-white">
                            {new Date(selectedCoupon.expired_at).toLocaleString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400 mb-1">유효시간</p>
                          <p className="text-[#00FF88] font-bold text-xl">
                            {getRemainingTime(selectedCoupon.expired_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 사용 안내 */}
                  <div className="bg-gray-800/50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 text-center">
                      이 화면을 매장에서 보여주세요<br/>
                      스크린샷은 인정되지 않습니다
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* 만료된 쿠폰 */}
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <X className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-red-400 mb-2">만료된 인증입니다</h3>
                    <p className="text-gray-400 text-sm mb-4">이 쿠폰은 유효시간이 지났습니다</p>
                    
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                      <p className="text-red-400 text-sm">
                        만료 시간: {new Date(selectedCoupon.expired_at).toLocaleString('ko-KR')}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

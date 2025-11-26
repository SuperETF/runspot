'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, History, Coffee, Utensils, ShoppingBag, Heart, MapPin, Calendar, Clock, CheckCircle, X, Timer } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getRunningLogCouponHistory, cleanupExpiredCoupons } from '@/lib/spots'
import { getGuestUserId } from '@/lib/auth'

export default function SpotHistoryPage() {
  const router = useRouter()
  const [runningLogHistory, setRunningLogHistory] = useState<any[]>([])
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
      const history = await getRunningLogCouponHistory(userId, 50) // 최근 50개
      setRunningLogHistory(history)
    } catch (error) {
      console.error('런닝 기록 이력 로딩 오류:', error)
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
          <div className="text-primary text-sm font-medium">
            사용완료
          </div>
        )
      case 'expired':
        return (
          <div className="text-muted-foreground text-sm font-medium">
            만료됨
          </div>
        )
      case 'active':
        return (
          <div className="text-primary text-sm font-medium">
            인증완료
          </div>
        )
      default:
        return (
          <div className="text-muted-foreground text-sm font-medium">
            인증완료
          </div>
        )
    }
  }


  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 상단 헤더 - 모바일 알림창 피하기 */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => router.push('/')}
            className="p-2 hover:bg-muted rounded-xl transition-colors"
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
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">인증 완료 내역</h2>
          <p className="text-muted-foreground">스팟에서 완주 인증한 모든 기록을 확인하세요</p>
        </div>


        {/* 히스토리 목록 */}
        <div>
          {loading ? (
            // 로딩 스켈레톤
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="bg-card/80 rounded-2xl p-4 border border-border animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted/80 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-muted/80 rounded mb-2"></div>
                      <div className="h-3 bg-muted/80 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted/80 rounded w-1/2"></div>
                    </div>
                    <div className="w-16 h-6 bg-muted/80 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : runningLogHistory.length > 0 ? (
            <div className="space-y-6">
              {runningLogHistory.map((logGroup, groupIndex) => (
                <div 
                  key={groupIndex} 
                  className="bg-card/80 glass rounded-2xl p-4 border border-border transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${groupIndex * 0.05}s` }}
                >
                  {/* 런닝 기록 헤더 */}
                  <div className="mb-4 pb-4 border-b border-border">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-foreground text-lg">
                          {logGroup.running_log.course?.name || '런닝 완주'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(logGroup.running_log.completed_at).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        logGroup.is_expired 
                          ? 'bg-muted text-muted-foreground' 
                          : 'bg-primary/20 text-primary'
                      }`}>
                        {logGroup.is_expired ? '만료됨' : `${logGroup.remaining_auth_count}곳 인증 가능`}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>거리: {(logGroup.running_log.distance / 1000).toFixed(2)}km</span>
                      <span>시간: {Math.floor(logGroup.running_log.duration / 60)}분</span>
                      <span>인증: {logGroup.running_log.authentication_count}/2곳</span>
                    </div>
                  </div>

                  {/* 인증한 스팟 목록 */}
                  {logGroup.coupons.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-foreground">인증한 스팟</h4>
                      {logGroup.coupons.map((coupon: any, couponIndex: number) => (
                        <div 
                          key={couponIndex}
                          onClick={() => handleCouponClick(coupon)}
                          className={`bg-muted/30 rounded-xl p-3 border border-border ${
                            coupon.status === 'active' ? 'cursor-pointer hover:bg-muted/50' : ''
                          } transition-colors`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h5 className="font-semibold text-foreground">{coupon.spots?.name || '알 수 없는 스팟'}</h5>
                              <p className="text-xs text-muted-foreground">{coupon.spots?.signature_menu}</p>
                            </div>
                            {getStatusBadge(coupon.status)}
                          </div>
                          
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">혜택</span>
                            <span className="text-primary font-medium">{coupon.discount_info}</span>
                          </div>
                          
                          {coupon.status === 'active' && (
                            <div className="mt-2 text-center">
                              <p className="text-xs text-muted-foreground">남은 시간</p>
                              <p className="text-primary font-bold">
                                {getRemainingTime(coupon.expired_at || coupon.expires_at)}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      아직 인증한 스팟이 없습니다
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // 빈 상태
            <div className="text-center py-12">
              <History className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                인증 완료 내역이 없습니다
              </h3>
              <p className="text-muted-foreground mb-6">
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
          <div className="bg-card rounded-3xl p-6 max-w-sm w-full border border-border relative overflow-hidden">
            {/* 배경 패턴 */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary to-transparent"></div>
            </div>
            
            {/* 닫기 버튼 */}
            <button 
              onClick={() => setShowCouponModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-muted rounded-xl transition-colors z-50"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            <div className="relative z-10">
              {isCouponValid(selectedCoupon) ? (
                <>
                  {/* 성공 아이콘 */}
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <CheckCircle className="w-8 h-8 text-black" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">인증 완료!</h3>
                    <p className="text-muted-foreground text-sm">완주 인증이 성공적으로 완료되었습니다</p>
                  </div>

                  {/* 쿠폰 정보 */}
                  <div className="bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 rounded-2xl p-4 mb-4">
                    <div className="text-center">
                      <h4 className="text-lg font-semibold text-foreground mb-1">{selectedCoupon.spots?.name}</h4>
                      <p className="text-primary font-medium text-lg mb-3">{selectedCoupon.discount_info}</p>
                      
                      {/* 유효시간 강조 */}
                      <div className="bg-black/30 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-muted-foreground">발급일시</p>
                          <p className="text-xs text-foreground">
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
                          <p className="text-xs text-muted-foreground">만료시간</p>
                          <p className="text-xs text-foreground">
                            {new Date(selectedCoupon.expired_at).toLocaleString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">유효시간</p>
                          <p className="text-primary font-bold text-xl">
                            {getRemainingTime(selectedCoupon.expired_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 사용 안내 */}
                  <div className="bg-muted/50 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground text-center">
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
                    <p className="text-muted-foreground text-sm mb-4">이 쿠폰은 유효시간이 지났습니다</p>
                    
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

      {/* 하단 탭 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border safe-bottom">
        <div className="flex items-center justify-around py-2">
          <button 
            onClick={() => router.push('/spots')}
            className="flex flex-col items-center gap-1 p-3 hover:bg-muted/50 rounded-xl transition-all duration-200 group"
          >
            <MapPin className="w-6 h-6 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" />
            <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">스팟</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-3 hover:bg-muted/50 rounded-xl transition-all duration-200 group">
            <Clock className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
            <span className="text-xs text-primary font-medium">인증 내역</span>
          </button>
        </div>
      </div>

      {/* 하단 여백 (탭 네비게이션 높이만큼) */}
      <div className="h-20"></div>
    </div>
  )
}

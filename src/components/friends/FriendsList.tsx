'use client'

import { useState, useEffect } from 'react'
import { Users, UserPlus, MapPin, Clock, Search, Loader2, UserCheck, UserX } from 'lucide-react'
import { getFriends, getPendingFriendRequests, acceptFriendRequest, rejectFriendRequest } from '@/lib/friends'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { FriendWithDetails, FriendRequest } from '@/types/database'
import Image from 'next/image'

interface FriendsListProps {
  onAddFriend?: () => void
  onViewFriendLocation?: (friend: FriendWithDetails) => void
}

export default function FriendsList({ onAddFriend, onViewFriendLocation }: FriendsListProps) {
  const [friends, setFriends] = useState<FriendWithDetails[]>([])
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends')
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)

  useEffect(() => {
    loadFriendsData()
  }, [])

  const loadFriendsData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [friendsResult, requestsResult] = await Promise.all([
        getFriends(),
        getPendingFriendRequests()
      ])

      if (friendsResult.success && friendsResult.data) {
        setFriends(friendsResult.data)
      } else {
        setError(friendsResult.error || '친구 목록을 불러오는데 실패했습니다.')
      }

      if (requestsResult.success && requestsResult.data) {
        setPendingRequests(requestsResult.data)
      }
    } catch (error) {
      console.error('친구 데이터 로드 실패:', error)
      setError('데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptRequest = async (requestId: string) => {
    try {
      setProcessingRequest(requestId)
      const result = await acceptFriendRequest(requestId)
      
      if (result.success) {
        // 친구 목록 새로고침
        await loadFriendsData()
      } else {
        setError(result.error || '친구 요청 수락에 실패했습니다.')
      }
    } catch (error) {
      console.error('친구 요청 수락 실패:', error)
      setError('친구 요청 수락 중 오류가 발생했습니다.')
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      setProcessingRequest(requestId)
      const result = await rejectFriendRequest(requestId)
      
      if (result.success) {
        // 요청 목록에서 제거
        setPendingRequests(prev => prev.filter(req => req.id !== requestId))
      } else {
        setError(result.error || '친구 요청 거절에 실패했습니다.')
      }
    } catch (error) {
      console.error('친구 요청 거절 실패:', error)
      setError('친구 요청 거절 중 오류가 발생했습니다.')
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleRemoveFriend = async (friendshipId: string) => {
    try {
      setProcessingRequest(friendshipId)
      const result = await rejectFriendRequest(friendshipId)
      
      if (result.success) {
        // 친구 목록에서 제거
        setFriends(prev => prev.filter(friend => friend.friendship_id !== friendshipId))
      } else {
        setError(result.error || '친구 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('친구 삭제 실패:', error)
      setError('친구 삭제 중 오류가 발생했습니다.')
    } finally {
      setProcessingRequest(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-[#00FF88]" />
        <span className="ml-2 text-gray-400">친구 목록을 불러오는 중...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">친구</h2>
        <button
          onClick={onAddFriend}
          className="flex items-center gap-2 px-4 py-2 bg-[#00FF88] text-black rounded-lg font-medium hover:bg-[#00FF88]/90 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          친구 추가
        </button>
      </div>

      {/* 탭 */}
      <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'friends'
              ? 'bg-[#00FF88] text-black'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Users className="h-4 w-4" />
            친구 ({friends.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors relative ${
            activeTab === 'requests'
              ? 'bg-[#00FF88] text-black'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <UserPlus className="h-4 w-4" />
            요청 ({pendingRequests.length})
            {pendingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
            )}
          </div>
        </button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* 친구 목록 */}
      {activeTab === 'friends' && (
        <div className="space-y-3">
          {friends.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-4">아직 친구가 없습니다</p>
              <button
                onClick={onAddFriend}
                className="px-4 py-2 bg-[#00FF88] text-black rounded-lg font-medium hover:bg-[#00FF88]/90 transition-colors"
              >
                첫 번째 친구 추가하기
              </button>
            </div>
          ) : (
            friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {friend.profile_image ? (
                      <Image
                        src={friend.profile_image}
                        alt={friend.name}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    {friend.is_location_shared && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#00FF88] rounded-full border-2 border-gray-800" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{friend.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>런닝 {friend.total_runs}회</span>
                      <span>{friend.total_distance.toFixed(1)}km</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      친구 된 지 {formatDistanceToNow(new Date(friend.friendship_created_at), { 
                        addSuffix: true, 
                        locale: ko 
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {friend.is_location_shared && onViewFriendLocation && (
                    <button
                      onClick={() => onViewFriendLocation(friend)}
                      className="p-2 text-[#00FF88] hover:bg-[#00FF88]/10 rounded-lg transition-colors"
                      title="위치 보기"
                    >
                      <MapPin className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveFriend(friend.friendship_id)}
                    disabled={processingRequest === friend.friendship_id}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                    title="친구 삭제"
                  >
                    {processingRequest === friend.friendship_id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserX className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 친구 요청 목록 */}
      {activeTab === 'requests' && (
        <div className="space-y-3">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">새로운 친구 요청이 없습니다</p>
            </div>
          ) : (
            pendingRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {request.requester.profile_image ? (
                    <Image
                      src={request.requester.profile_image}
                      alt={request.requester.name}
                      width={48}
                      height={48}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-white">{request.requester.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>런닝 {request.requester.total_runs}회</span>
                      <span>{request.requester.total_distance.toFixed(1)}km</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(request.created_at), { 
                        addSuffix: true, 
                        locale: ko 
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAcceptRequest(request.id)}
                    disabled={processingRequest === request.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#00FF88] text-black rounded-lg text-sm font-medium hover:bg-[#00FF88]/90 transition-colors disabled:opacity-50"
                  >
                    {processingRequest === request.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <UserCheck className="h-3 w-3" />
                    )}
                    수락
                  </button>
                  <button
                    onClick={() => handleRejectRequest(request.id)}
                    disabled={processingRequest === request.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    {processingRequest === request.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <UserX className="h-3 w-3" />
                    )}
                    거절
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

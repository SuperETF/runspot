'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import FriendsList from '@/components/friends/FriendsList'
import AddFriendModal from '@/components/friends/AddFriendModal'
import LocationSharingSettings from '@/components/friends/LocationSharingSettings'
import type { FriendWithDetails } from '@/types/database'

export default function FriendsPage() {
  const router = useRouter()
  const [showAddFriendModal, setShowAddFriendModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'friends' | 'settings'>('friends')

  const handleAddFriend = () => {
    setShowAddFriendModal(true)
  }

  const handleFriendAdded = () => {
    // 친구 목록 새로고침을 위해 페이지 리로드하거나 상태 업데이트
    window.location.reload()
  }

  const handleViewFriendLocation = (friend: FriendWithDetails) => {
    // 친구 위치를 지도에서 보여주는 기능 (나중에 구현)
    console.log('친구 위치 보기:', friend)
    // TODO: 지도 페이지로 이동하거나 모달 표시
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold">친구</h1>
          <div className="w-9" /> {/* 균형을 위한 빈 공간 */}
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'friends'
                ? 'text-[#00FF88] border-b-2 border-[#00FF88]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            친구 목록
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'text-[#00FF88] border-b-2 border-[#00FF88]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            위치 공유 설정
          </button>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="p-4">
        {activeTab === 'friends' ? (
          <FriendsList
            onAddFriend={handleAddFriend}
            onViewFriendLocation={handleViewFriendLocation}
          />
        ) : (
          <LocationSharingSettings />
        )}
      </div>

      {/* 친구 추가 모달 */}
      <AddFriendModal
        isOpen={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
        onFriendAdded={handleFriendAdded}
      />
    </div>
  )
}

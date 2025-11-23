'use client'

import { useState, useEffect } from 'react'
import { X, Search, UserPlus, Loader2, Users, ArrowLeft, Mail } from 'lucide-react'
import { searchUsers, sendFriendRequest, findUserByEmail } from '@/lib/friends'
import type { User } from '@/types/database'
import Image from 'next/image'

interface AddFriendByEmailModalProps {
  isOpen: boolean
  onClose: () => void
  onBack: () => void
  onFriendAdded?: () => void
}

export default function AddFriendByEmailModal({ 
  isOpen, 
  onClose, 
  onBack, 
  onFriendAdded 
}: AddFriendByEmailModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sendingRequest, setSendingRequest] = useState<string | null>(null)
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timeoutId = setTimeout(() => {
        handleSearch(searchQuery)
      }, 300) // 300ms 디바운스

      return () => clearTimeout(timeoutId)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const handleSearch = async (query: string) => {
    try {
      setLoading(true)
      setError(null)

      // 이메일 형식인지 확인
      const isEmail = query.includes('@')
      
      let result
      if (isEmail) {
        // 정확한 이메일 검색
        result = await findUserByEmail(query)
        if (result.success && result.data) {
          setSearchResults([result.data])
        } else {
          setSearchResults([])
          setError(result.error || '해당 이메일의 사용자를 찾을 수 없습니다.')
        }
      } else {
        // 일반 검색 (이름 또는 이메일)
        result = await searchUsers(query)
        if (result.success && result.data) {
          setSearchResults(result.data)
        } else {
          setError(result.error || '사용자 검색에 실패했습니다.')
          setSearchResults([])
        }
      }
    } catch (error) {
      console.error('사용자 검색 실패:', error)
      setError('검색 중 오류가 발생했습니다.')
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSendRequest = async (userId: string) => {
    try {
      setSendingRequest(userId)
      setError(null)

      const result = await sendFriendRequest(userId)
      
      if (result.success) {
        // 요청 전송 성공
        setSentRequests(prev => new Set([...prev, userId]))
        onFriendAdded?.()
      } else {
        setError(result.error || '친구 요청 전송에 실패했습니다.')
      }
    } catch (error) {
      console.error('친구 요청 전송 실패:', error)
      setError('친구 요청 전송 중 오류가 발생했습니다.')
    } finally {
      setSendingRequest(null)
    }
  }

  const handleClose = () => {
    setSearchQuery('')
    setSearchResults([])
    setError(null)
    setSentRequests(new Set())
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-white">이메일로 친구 추가</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 검색 입력 */}
        <div className="p-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="email"
              placeholder="이메일 주소 또는 사용자 이름..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#00FF88] transition-colors"
              autoFocus
            />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <p>• 정확한 이메일 주소를 입력하면 해당 사용자를 찾습니다</p>
            <p>• 이름으로 검색하면 관련 사용자들을 표시합니다</p>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mx-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* 검색 결과 */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#00FF88]" />
              <span className="ml-2 text-gray-400">검색 중...</span>
            </div>
          ) : searchResults.length === 0 && searchQuery.trim().length >= 2 ? (
            <div className="text-center p-8">
              <Users className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">검색 결과가 없습니다</p>
              <p className="text-gray-500 text-sm mt-1">다른 이메일이나 이름으로 검색해보세요</p>
            </div>
          ) : searchQuery.trim().length < 2 ? (
            <div className="text-center p-8">
              <Search className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">이메일 주소나 이름을 입력하세요</p>
              <p className="text-gray-500 text-sm mt-1">최소 2글자 이상 입력해주세요</p>
            </div>
          ) : (
            <div className="space-y-2 p-4 pt-0">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {user.profile_image ? (
                      <Image
                        src={user.profile_image}
                        alt={user.name}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium text-white">{user.name}</h3>
                      {user.email && (
                        <p className="text-xs text-gray-500">{user.email}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>런닝 {user.total_runs}회</span>
                        <span>{user.total_distance.toFixed(1)}km</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    {sentRequests.has(user.id) ? (
                      <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 text-gray-400 rounded-lg text-sm">
                        <UserPlus className="h-3 w-3" />
                        요청 전송됨
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSendRequest(user.id)}
                        disabled={sendingRequest === user.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#00FF88] text-black rounded-lg text-sm font-medium hover:bg-[#00FF88]/90 transition-colors disabled:opacity-50"
                      >
                        {sendingRequest === user.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <UserPlus className="h-3 w-3" />
                        )}
                        친구 요청
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-4 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            친구 요청을 보내면 상대방이 수락할 때까지 대기 상태가 됩니다
          </p>
        </div>
      </div>
    </div>
  )
}

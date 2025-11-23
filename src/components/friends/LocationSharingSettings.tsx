'use client'

import { useState, useEffect } from 'react'
import { MapPin, Shield, Users, Play, Loader2, Check } from 'lucide-react'
import { getLocationSettings, updateLocationSettings } from '@/lib/friends'
import type { UserLocationSettings, LocationSharingStatus } from '@/types/database'

export default function LocationSharingSettings() {
  const [settings, setSettings] = useState<UserLocationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await getLocationSettings()
      
      if (result.success && result.data) {
        setSettings(result.data)
      } else {
        setError(result.error || '설정을 불러오는데 실패했습니다.')
      }
    } catch (error) {
      console.error('설정 로드 실패:', error)
      setError('설정을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSettings = async (updates: Partial<UserLocationSettings>) => {
    if (!settings) return

    try {
      setUpdating(true)
      setError(null)
      setSuccessMessage(null)

      const result = await updateLocationSettings(updates)
      
      if (result.success && result.data) {
        setSettings(result.data)
        setSuccessMessage('설정이 저장되었습니다')
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        setError(result.error || '설정 저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('설정 업데이트 실패:', error)
      setError('설정 저장 중 오류가 발생했습니다.')
    } finally {
      setUpdating(false)
    }
  }

  const handleSharingStatusChange = (status: LocationSharingStatus) => {
    handleUpdateSettings({ sharing_status: status })
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-[#00FF88]" />
        <span className="ml-2 text-gray-400">설정을 불러오는 중...</span>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
        <p className="text-red-400">설정을 불러올 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <MapPin className="h-6 w-6 text-[#00FF88]" />
        <h2 className="text-xl font-bold text-white">위치 공유 설정</h2>
      </div>

      {/* 성공/에러 메시지 */}
      {successMessage && (
        <div className="flex items-center gap-2 p-3 bg-[#00FF88]/10 border border-[#00FF88]/20 rounded-lg">
          <Check className="h-4 w-4 text-[#00FF88]" />
          <p className="text-[#00FF88] text-sm">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* 위치 공유 상태 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">위치 공유 상태</h3>
        <div className="space-y-3">
          {/* 비활성화 */}
          <label className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
            <input
              type="radio"
              name="sharing_status"
              value="disabled"
              checked={settings.sharing_status === 'disabled'}
              onChange={() => handleSharingStatusChange('disabled')}
              disabled={updating}
              className="w-4 h-4 text-[#00FF88] bg-gray-700 border-gray-600 focus:ring-[#00FF88] focus:ring-2"
            />
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-white">위치 공유 안함</p>
                <p className="text-sm text-gray-400">위치 정보를 공유하지 않습니다</p>
              </div>
            </div>
          </label>

          {/* 친구에게만 */}
          <label className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
            <input
              type="radio"
              name="sharing_status"
              value="friends_only"
              checked={settings.sharing_status === 'friends_only'}
              onChange={() => handleSharingStatusChange('friends_only')}
              disabled={updating}
              className="w-4 h-4 text-[#00FF88] bg-gray-700 border-gray-600 focus:ring-[#00FF88] focus:ring-2"
            />
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-[#00FF88]" />
              <div>
                <p className="font-medium text-white">친구에게만 공유</p>
                <p className="text-sm text-gray-400">친구들에게만 위치를 공유합니다</p>
              </div>
            </div>
          </label>

          {/* 런닝 중에만 */}
          <label className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
            <input
              type="radio"
              name="sharing_status"
              value="running_only"
              checked={settings.sharing_status === 'running_only'}
              onChange={() => handleSharingStatusChange('running_only')}
              disabled={updating}
              className="w-4 h-4 text-[#00FF88] bg-gray-700 border-gray-600 focus:ring-[#00FF88] focus:ring-2"
            />
            <div className="flex items-center gap-3">
              <Play className="h-5 w-5 text-orange-400" />
              <div>
                <p className="font-medium text-white">런닝 중에만 공유</p>
                <p className="text-sm text-gray-400">런닝 중에만 친구들에게 위치를 공유합니다</p>
              </div>
            </div>
          </label>
        </div>
      </div>


      {/* 안내 메시지 */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
          <div>
            <p className="font-medium text-blue-400 mb-1">개인정보 보호</p>
            <p className="text-sm text-gray-400">
              위치 정보는 암호화되어 저장되며, 설정한 친구들에게만 공유됩니다. 
              언제든지 위치 공유를 중단할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 로딩 상태 */}
      {updating && (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-5 w-5 animate-spin text-[#00FF88]" />
          <span className="ml-2 text-gray-400">설정을 저장하는 중...</span>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { ArrowLeft, Smartphone } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function NotificationsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState({
    pushNotifications: true
  })

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const saveSettings = async () => {
    // TODO: Supabase에 설정 저장
    console.log('알림 설정 저장:', settings)
    // 임시로 성공 메시지 표시
    alert('설정이 저장되었습니다.')
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
          <h1 className="text-lg font-semibold">알림 설정</h1>
          <button 
            onClick={saveSettings}
            className="text-[#00FF88] font-medium hover:text-[#00E077] transition-colors"
          >
            저장
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* 푸시 알림 */}
        <div className="bg-gray-900/80 glass rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="w-6 h-6 text-[#00FF88]" />
            <h3 className="text-lg font-semibold">푸시 알림</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">푸시 알림 허용</p>
                <p className="text-sm text-gray-400">앱 알림을 받을지 설정합니다</p>
              </div>
              <button
                onClick={() => handleToggle('pushNotifications')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.pushNotifications ? 'bg-[#00FF88]' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between opacity-50">
              <div>
                <p className="text-white font-medium">런닝 리마인더</p>
                <p className="text-sm text-gray-400">정기적인 런닝 알림 (준비중)</p>
              </div>
              <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-600">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
              </div>
            </div>

            <div className="flex items-center justify-between opacity-50">
              <div>
                <p className="text-white font-medium">업적 알림</p>
                <p className="text-sm text-gray-400">새로운 업적 달성 시 알림 (준비중)</p>
              </div>
              <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-600">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
              </div>
            </div>

            <div className="flex items-center justify-between opacity-50">
              <div>
                <p className="text-white font-medium">친구 활동</p>
                <p className="text-sm text-gray-400">친구들의 런닝 활동 알림 (준비중)</p>
              </div>
              <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-600">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
              </div>
            </div>
          </div>
        </div>



        {/* 하단 여백 */}
        <div className="h-20"></div>
      </div>
    </div>
  )
}

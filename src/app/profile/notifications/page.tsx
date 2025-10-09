'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Bell, Smartphone, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function NotificationsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: false,
    runningReminders: true,
    achievementAlerts: true,
    weeklyReports: false,
    friendActivity: true
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

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">런닝 리마인더</p>
                <p className="text-sm text-gray-400">정기적인 런닝 알림</p>
              </div>
              <button
                onClick={() => handleToggle('runningReminders')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.runningReminders ? 'bg-[#00FF88]' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.runningReminders ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">업적 알림</p>
                <p className="text-sm text-gray-400">새로운 업적 달성 시 알림</p>
              </div>
              <button
                onClick={() => handleToggle('achievementAlerts')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.achievementAlerts ? 'bg-[#00FF88]' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.achievementAlerts ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">친구 활동</p>
                <p className="text-sm text-gray-400">친구들의 런닝 활동 알림</p>
              </div>
              <button
                onClick={() => handleToggle('friendActivity')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.friendActivity ? 'bg-[#00FF88]' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.friendActivity ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 이메일 알림 */}
        <div className="bg-gray-900/80 glass rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-6 h-6 text-[#00FF88]" />
            <h3 className="text-lg font-semibold">이메일 알림</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">이메일 알림 허용</p>
                <p className="text-sm text-gray-400">이메일로 알림을 받을지 설정합니다</p>
              </div>
              <button
                onClick={() => handleToggle('emailNotifications')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.emailNotifications ? 'bg-[#00FF88]' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">주간 리포트</p>
                <p className="text-sm text-gray-400">주간 런닝 통계 리포트</p>
              </div>
              <button
                onClick={() => handleToggle('weeklyReports')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.weeklyReports ? 'bg-[#00FF88]' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.weeklyReports ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 알림 시간 설정 */}
        <div className="bg-gray-900/80 glass rounded-2xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold mb-4">알림 시간</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">런닝 리마인더 시간</label>
              <select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00FF88]">
                <option value="08:00">오전 8:00</option>
                <option value="18:00">오후 6:00</option>
                <option value="19:00">오후 7:00</option>
                <option value="20:00">오후 8:00</option>
              </select>
            </div>
          </div>
        </div>

        {/* 하단 여백 */}
        <div className="h-20"></div>
      </div>
    </div>
  )
}

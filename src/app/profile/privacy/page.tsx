'use client'

import { ArrowLeft, Eye, Users, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PrivacyPage() {
  const router = useRouter()
  const saveSettings = async () => {
    // TODO: 실제 기능 구현 시 사용
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
          <h1 className="text-lg font-semibold">개인정보 설정</h1>
          <button 
            onClick={saveSettings}
            className="text-[#00FF88] font-medium hover:text-[#00E077] transition-colors"
          >
            저장
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* 프로필 공개 설정 */}
        <div className="bg-gray-900/80 glass rounded-2xl p-6 border border-gray-800 opacity-50">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-6 h-6 text-[#00FF88]" />
            <h3 className="text-lg font-semibold">프로필 공개 (준비중)</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">공개 프로필</p>
                <p className="text-sm text-gray-400">다른 사용자가 내 프로필을 볼 수 있습니다 (준비중)</p>
              </div>
              <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-600">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">런닝 통계 공개</p>
                <p className="text-sm text-gray-400">총 거리, 런닝 횟수 등 통계 공개 (준비중)</p>
              </div>
              <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-600">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">활동 기록 공개</p>
                <p className="text-sm text-gray-400">최근 런닝 활동 기록 공개 (준비중)</p>
              </div>
              <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-600">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
              </div>
            </div>
          </div>
        </div>

        {/* 소셜 설정 */}
        <div className="bg-gray-900/80 glass rounded-2xl p-6 border border-gray-800 opacity-50">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-[#00FF88]" />
            <h3 className="text-lg font-semibold">소셜 설정 (준비중)</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">친구 요청 허용</p>
                <p className="text-sm text-gray-400">다른 사용자의 친구 요청을 받습니다 (준비중)</p>
              </div>
              <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-600">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
              </div>
            </div>
          </div>
        </div>

        {/* 위치 정보 */}
        <div className="bg-gray-900/80 glass rounded-2xl p-6 border border-gray-800 opacity-50">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-6 h-6 text-[#00FF88]" />
            <h3 className="text-lg font-semibold">위치 정보 (준비중)</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">위치 공유</p>
                <p className="text-sm text-gray-400">런닝 중 실시간 위치를 친구와 공유 (준비중)</p>
              </div>
              <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-600">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
              </div>
            </div>
          </div>
        </div>


        {/* 계정 관리 */}
        <div className="bg-gray-900/80 glass rounded-2xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold mb-4">계정 관리</h3>
          
          <div className="space-y-3">
            <button className="w-full text-left p-3 hover:bg-gray-800/50 rounded-xl transition-colors">
              <p className="text-red-400 font-medium">계정 삭제</p>
              <p className="text-sm text-gray-400">계정과 모든 데이터를 영구 삭제합니다</p>
            </button>
          </div>
        </div>

        {/* 하단 여백 */}
        <div className="h-20"></div>
      </div>
    </div>
  )
}

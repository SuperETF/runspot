'use client'

import { useState } from 'react'
import { Users, MapPin, Clock, Activity, Navigation } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { FriendLocationData } from '@/types/database'

interface FriendLocationMarkerProps {
  friendData: FriendLocationData
  onClick?: (friendData: FriendLocationData) => void
  showPopup?: boolean
  onClosePopup?: () => void
}

export default function FriendLocationMarker({ 
  friendData, 
  onClick, 
  showPopup = false, 
  onClosePopup 
}: FriendLocationMarkerProps) {
  const { friend, location, distance_from_user, is_running, course } = friendData

  // 마커 스타일 결정
  const getMarkerStyle = () => {
    if (is_running) {
      return {
        backgroundColor: '#00FF88',
        border: '3px solid #00E077',
        animation: 'pulse 2s infinite'
      }
    }
    return {
      backgroundColor: '#6B7280',
      border: '2px solid #4B5563'
    }
  }

  // 활동 상태 텍스트
  const getActivityStatus = () => {
    if (is_running && course) {
      return `${course.name}에서 런닝 중`
    } else if (is_running) {
      return '런닝 중'
    }
    return '온라인'
  }

  // 속도 표시 (km/h)
  const getSpeedText = () => {
    if (location.speed && location.speed > 0) {
      return `${location.speed.toFixed(1)} km/h`
    }
    return null
  }

  // 마지막 업데이트 시간
  const getLastUpdateText = () => {
    return formatDistanceToNow(new Date(location.shared_at), {
      addSuffix: true,
      locale: ko
    })
  }

  return (
    <>
      {/* 마커 */}
      <div
        className="relative cursor-pointer transform transition-transform hover:scale-110"
        onClick={() => onClick?.(friendData)}
        style={{
          position: 'absolute',
          transform: 'translate(-50%, -50%)',
          zIndex: is_running ? 1000 : 999
        }}
      >
        {/* 아바타 마커 */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg transition-all duration-300"
          style={getMarkerStyle()}
        >
          {friend.profile_image ? (
            <img
              src={friend.profile_image}
              alt={friend.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span>{friend.name.charAt(0).toUpperCase()}</span>
          )}
        </div>

        {/* 런닝 중 표시 */}
        {is_running && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        )}

        {/* 방향 표시 (heading이 있는 경우) */}
        {location.heading !== null && location.heading !== undefined && (
          <div
            className="absolute -bottom-1 left-1/2 transform -translate-x-1/2"
            style={{
              transform: `translateX(-50%) rotate(${location.heading}deg)`
            }}
          >
            <Navigation className="w-3 h-3 text-blue-500" />
          </div>
        )}
      </div>

      {/* 팝업 */}
      {showPopup && (
        <div
          className="absolute bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-64 z-[1001]"
          style={{
            position: 'absolute',
            transform: 'translate(-50%, -100%)',
            marginTop: '-10px'
          }}
        >
          {/* 팝업 화살표 */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white" />
          
          {/* 닫기 버튼 */}
          <button
            onClick={onClosePopup}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>

          {/* 친구 정보 */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {friend.profile_image ? (
                <img
                  src={friend.profile_image}
                  alt={friend.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Users className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{friend.name}</h3>
              <p className="text-sm text-gray-600">
                런닝 {friend.total_runs}회 · {friend.total_distance.toFixed(1)}km
              </p>
            </div>
          </div>

          {/* 활동 상태 */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Activity className={`w-4 h-4 ${is_running ? 'text-green-500' : 'text-gray-400'}`} />
              <span className={is_running ? 'text-green-600 font-medium' : 'text-gray-600'}>
                {getActivityStatus()}
              </span>
            </div>

            {/* 거리 정보 */}
            {distance_from_user !== undefined && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span className="text-gray-600">
                  {distance_from_user < 1 
                    ? `${Math.round(distance_from_user * 1000)}m 거리`
                    : `${distance_from_user.toFixed(1)}km 거리`
                  }
                </span>
              </div>
            )}

            {/* 속도 정보 */}
            {getSpeedText() && (
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-purple-500" />
                <span className="text-gray-600">{getSpeedText()}</span>
              </div>
            )}

            {/* 마지막 업데이트 */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500 text-xs">{getLastUpdateText()}</span>
            </div>

            {/* GPS 정확도 */}
            {location.accuracy && (
              <div className="text-xs text-gray-400">
                GPS 정확도: ±{Math.round(location.accuracy)}m
              </div>
            )}
          </div>

          {/* 코스 정보 (런닝 중인 경우) */}
          {course && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-sm">
                <p className="font-medium text-gray-900">{course.name}</p>
                <p className="text-gray-600">
                  {course.area} · {course.difficulty} · {course.distance.toFixed(1)}km
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 애니메이션 스타일 */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
      `}</style>
    </>
  )
}

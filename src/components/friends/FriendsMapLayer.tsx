'use client'

import { useEffect, useState } from 'react'
import { Users, MapPin, Play, Clock } from 'lucide-react'
import { useFriendsStore } from '@/stores/friendsStore'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { FriendLocationData } from '@/types/database'
import Image from 'next/image'

interface FriendsMapLayerProps {
  map: any // 카카오맵 인스턴스
  userLocation?: { lat: number; lng: number } | null
  showFriends?: boolean
  onFriendClick?: (friend: FriendLocationData) => void
}

export default function FriendsMapLayer({ 
  map, 
  userLocation, 
  showFriends = true,
  onFriendClick 
}: FriendsMapLayerProps) {
  const {
    friendsLocations,
    locationsLoading,
    loadFriendsLocations,
    lastLocationUpdate
  } = useFriendsStore()

  const [friendMarkers, setFriendMarkers] = useState<any[]>([])
  const [friendInfoWindows, setFriendInfoWindows] = useState<any[]>([])

  // 친구 위치 데이터 로드
  useEffect(() => {
    if (showFriends && userLocation) {
      loadFriendsLocations(userLocation)
    }
  }, [showFriends, userLocation, loadFriendsLocations])

  // 주기적으로 친구 위치 업데이트 (30초마다)
  useEffect(() => {
    if (!showFriends || !userLocation) return

    const interval = setInterval(() => {
      loadFriendsLocations(userLocation)
    }, 30000) // 30초

    return () => clearInterval(interval)
  }, [showFriends, userLocation, loadFriendsLocations])

  // 지도에 친구 마커 표시
  useEffect(() => {
    if (!map || !showFriends || !window.kakao?.maps) return

    // 기존 마커와 인포윈도우 제거
    friendMarkers.forEach(marker => marker.setMap(null))
    friendInfoWindows.forEach(infoWindow => infoWindow.close())

    if (friendsLocations.length === 0) {
      setFriendMarkers([])
      setFriendInfoWindows([])
      return
    }

    const newMarkers: any[] = []
    const newInfoWindows: any[] = []

    friendsLocations.forEach((friendData) => {
      const { friend, location, distance_from_user, is_running, course } = friendData

      // 친구 마커 생성
      const markerPosition = new window.kakao.maps.LatLng(
        location.latitude,
        location.longitude
      )

      // 마커 이미지 설정 (런닝 중인지에 따라 다른 색상)
      const markerImageSrc = is_running 
        ? 'data:image/svg+xml;base64,' + btoa(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" fill="#00FF88" stroke="#000" stroke-width="2"/>
            <circle cx="16" cy="16" r="8" fill="#000"/>
            <text x="16" y="20" text-anchor="middle" fill="#00FF88" font-size="10" font-weight="bold">R</text>
          </svg>
        `)
        : 'data:image/svg+xml;base64,' + btoa(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" fill="#3B82F6" stroke="#000" stroke-width="2"/>
            <circle cx="16" cy="16" r="8" fill="#000"/>
            <text x="16" y="20" text-anchor="middle" fill="#3B82F6" font-size="10" font-weight="bold">F</text>
          </svg>
        `)

      const markerImage = new window.kakao.maps.MarkerImage(
        markerImageSrc,
        new window.kakao.maps.Size(32, 32),
        { offset: new window.kakao.maps.Point(16, 16) }
      )

      const marker = new window.kakao.maps.Marker({
        position: markerPosition,
        image: markerImage,
        title: friend.name
      })

      marker.setMap(map)

      // 인포윈도우 콘텐츠 생성
      const infoWindowContent = `
        <div style="
          padding: 12px;
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 8px;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          min-width: 200px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        ">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <div style="
              width: 32px;
              height: 32px;
              background: ${is_running ? '#00FF88' : '#3B82F6'};
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: bold;
              color: black;
            ">
              ${friend.name.charAt(0)}
            </div>
            <div>
              <div style="font-weight: bold; font-size: 14px;">${friend.name}</div>
              <div style="font-size: 11px; color: #888;">
                ${is_running ? '🏃‍♂️ 런닝 중' : '📍 위치 공유 중'}
              </div>
            </div>
          </div>
          
          ${course ? `
            <div style="font-size: 12px; color: #00FF88; margin-bottom: 4px;">
              📍 ${course.name}
            </div>
          ` : ''}
          
          <div style="font-size: 11px; color: #ccc;">
            ${distance_from_user ? `거리: ${distance_from_user.toFixed(1)}km` : ''}
            ${distance_from_user ? ' • ' : ''}
            ${formatDistanceToNow(new Date(location.shared_at), { addSuffix: true, locale: ko })}
          </div>
          
          ${location.speed && location.speed > 0 ? `
            <div style="font-size: 11px; color: #888; margin-top: 4px;">
              속도: ${(location.speed * 3.6).toFixed(1)} km/h
            </div>
          ` : ''}
        </div>
      `

      const infoWindow = new window.kakao.maps.InfoWindow({
        content: infoWindowContent,
        removable: true
      })

      // 마커 클릭 이벤트
      window.kakao.maps.event.addListener(marker, 'click', () => {
        // 다른 인포윈도우 닫기
        newInfoWindows.forEach(iw => iw.close())
        
        // 현재 인포윈도우 열기
        infoWindow.open(map, marker)
        
        // 콜백 호출
        onFriendClick?.(friendData)
      })

      newMarkers.push(marker)
      newInfoWindows.push(infoWindow)
    })

    setFriendMarkers(newMarkers)
    setFriendInfoWindows(newInfoWindows)

    // 컴포넌트 언마운트 시 정리
    return () => {
      newMarkers.forEach(marker => marker.setMap(null))
      newInfoWindows.forEach(infoWindow => infoWindow.close())
    }
  }, [map, showFriends, friendsLocations, onFriendClick])

  // 친구 위치 목록 UI (지도 위 오버레이)
  if (!showFriends || friendsLocations.length === 0) {
    return null
  }

  return (
    <div className="absolute top-4 right-4 z-10 space-y-2">
      {/* 친구 위치 요약 */}
      <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-4 w-4 text-[#00FF88]" />
          <span className="text-white text-sm font-medium">
            친구 위치 ({friendsLocations.length})
          </span>
        </div>
        
        <div className="space-y-2">
          {friendsLocations.slice(0, 3).map((friendData) => (
            <div
              key={friendData.friend.id}
              className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-700/50 rounded p-1 transition-colors"
              onClick={() => onFriendClick?.(friendData)}
            >
              <div className={`w-2 h-2 rounded-full ${
                friendData.is_running ? 'bg-[#00FF88]' : 'bg-blue-400'
              }`} />
              <span className="text-white truncate flex-1">
                {friendData.friend.name}
              </span>
              {friendData.distance_from_user && (
                <span className="text-gray-400">
                  {friendData.distance_from_user.toFixed(1)}km
                </span>
              )}
            </div>
          ))}
          
          {friendsLocations.length > 3 && (
            <div className="text-xs text-gray-400 text-center">
              +{friendsLocations.length - 3}명 더
            </div>
          )}
        </div>
        
        {lastLocationUpdate && (
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-700">
            <Clock className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(lastLocationUpdate, { addSuffix: true, locale: ko })} 업데이트
            </span>
          </div>
        )}
      </div>
      
      {/* 로딩 상태 */}
      {locationsLoading && (
        <div className="bg-black/80 backdrop-blur-sm rounded-lg p-2 border border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border border-[#00FF88] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-400">위치 업데이트 중...</span>
          </div>
        </div>
      )}
    </div>
  )
}

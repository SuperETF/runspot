'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Script from 'next/script'

export default function CreateSpotPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    category: 'restaurant',
    description: '',
    signature_menu: '',
    address: '',
    phone: '',
    open_time: '',
    discount_percentage: '',
    special_offer: '',
    latitude: 0,
    longitude: 0
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  
  // 주소 검색 관련
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // 카카오맵 SDK 로드 확인
  useEffect(() => {
    const checkKakaoMaps = setInterval(() => {
      if ((window as any).kakao?.maps?.services) {
        console.log('✅ 카카오맵 SDK 로드 완료')
        clearInterval(checkKakaoMaps)
      }
    }, 100)

    return () => clearInterval(checkKakaoMaps)
  }, [])

  // 주소 검색 함수
  const searchAddress = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setIsSearching(true)
    
    try {
      if (!(window as any).kakao?.maps?.services) {
        alert('카카오맵이 로드되지 않았습니다. 잠시 후 다시 시도해주세요.')
        setIsSearching(false)
        return
      }

      const places = new (window as any).kakao.maps.services.Places()
      
      places.keywordSearch(query, (data: any[], status: any) => {
        if (status === (window as any).kakao.maps.services.Status.OK) {
          setSearchResults(data)
          setShowSearchResults(true)
        } else {
          setSearchResults([])
          setShowSearchResults(true)
        }
        setIsSearching(false)
      })
    } catch (error) {
      console.error('주소 검색 오류:', error)
      alert('주소 검색 중 오류가 발생했습니다.')
      setIsSearching(false)
    }
  }

  // 검색 결과 선택
  const selectSearchResult = (result: any) => {
    setFormData(prev => ({
      ...prev,
      address: result.place_name || result.address_name,
      latitude: parseFloat(result.y),
      longitude: parseFloat(result.x)
    }))
    setSearchQuery(result.place_name || result.address_name)
    setShowSearchResults(false)
  }

  // 폼 입력 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // 로고 파일 선택
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 51200) {
        alert('로고 이미지는 50KB 이하로 업로드해주세요.')
        e.target.value = ''
        return
      }
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.')
        e.target.value = ''
        return
      }
      setLogoFile(file)
    }
  }

  // 전경사진 파일 선택
  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles: File[] = []
    
    for (const file of files) {
      if (file.size > 204800) {
        alert(`"${file.name}"은 200KB를 초과합니다.`)
        continue
      }
      if (!file.type.startsWith('image/')) {
        alert(`"${file.name}"은 이미지 파일이 아닙니다.`)
        continue
      }
      validFiles.push(file)
    }
    
    setImageFiles(prev => [...prev, ...validFiles])
  }

  // 이미지 제거
  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
  }

  // 이미지 압축 함수
  const compressImage = (file: File, maxWidth: number, maxHeight: number, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      img.onload = () => {
        let { width, height } = img
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }
        
        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedBase64)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  // 파일을 Base64로 변환
  const fileToBase64 = async (file: File): Promise<string> => {
    const isLogo = file === logoFile
    const maxWidth = isLogo ? 200 : 800
    const maxHeight = isLogo ? 200 : 600
    const quality = isLogo ? 0.9 : 0.8
    
    return await compressImage(file, maxWidth, maxHeight, quality)
  }

  // 스팟 등록
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.address) {
      alert('스팟명과 주소는 필수 입력 항목입니다.')
      return
    }

    if (formData.latitude === 0 || formData.longitude === 0) {
      alert('주소 검색을 통해 정확한 위치를 선택해주세요.')
      return
    }

    setSaving(true)
    try {
      // 이미지 처리
      const [logoUrl, ...imageUrls] = await Promise.all([
        logoFile ? fileToBase64(logoFile) : Promise.resolve(''),
        ...imageFiles.map(file => fileToBase64(file))
      ])

      const spotData = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        signature_menu: formData.signature_menu,
        address: formData.address,
        phone: formData.phone || null,
        open_time: formData.open_time || null,
        discount_percentage: formData.discount_percentage ? parseInt(formData.discount_percentage) : null,
        special_offer: formData.special_offer || null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        logo_url: logoUrl,
        images: imageUrls,
        is_active: true
      }

      const { error } = await (supabase as any)
        .from('spots')
        .insert([spotData])

      if (error) {
        console.error('스팟 등록 오류:', error)
        alert('스팟 등록 중 오류가 발생했습니다.')
      } else {
        alert('제휴 스팟이 성공적으로 등록되었습니다!')
        router.push('/admin')
      }
    } catch (error) {
      console.error('스팟 등록 실패:', error)
      alert('스팟 등록 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* 카카오맵 스크립트 */}
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&libraries=services&autoload=false`}
        strategy="beforeInteractive"
        onLoad={() => {
          (window as any).kakao.maps.load(() => {
            console.log('✅ 카카오맵 SDK 로드 완료')
          })
        }}
      />

      <div className="min-h-screen bg-background text-foreground">
        {/* 헤더 */}
        <div className="bg-card border-b border-border sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <button
                onClick={() => router.push('/admin')}
                className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span>관리자 페이지로</span>
              </button>
            </div>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">새 제휴 스팟 등록</h1>
            <p className="text-muted-foreground">제휴 스팟 정보를 입력하고 등록하세요.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <div className="bg-card rounded-2xl p-6 space-y-4">
              <h2 className="text-xl font-semibold mb-4">기본 정보</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">스팟명 *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">카테고리</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:border-primary"
                  >
                    <option value="restaurant">음식점</option>
                    <option value="cafe">카페</option>
                    <option value="fitness">피트니스</option>
                    <option value="retail">소매점</option>
                    <option value="service">서비스</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">설명</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* 주소 검색 */}
            <div className="bg-card rounded-2xl p-6 space-y-4">
              <h2 className="text-xl font-semibold mb-4">위치 정보</h2>
              
              <div>
                <label className="block text-sm font-medium mb-2">주소 검색 *</label>
                <div className="relative">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), searchAddress(searchQuery))}
                      placeholder="장소명이나 주소를 입력하세요"
                      className="flex-1 px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => searchAddress(searchQuery)}
                      disabled={isSearching}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <Search className="w-4 h-4" />
                      {isSearching ? '검색 중...' : '검색'}
                    </button>
                  </div>

                  {/* 검색 결과 드롭다운 */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-card border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto">
                      {searchResults.map((result, index) => (
                        <div
                          key={index}
                          onClick={() => selectSearchResult(result)}
                          className="p-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                        >
                          <div className="font-medium">{result.place_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {result.road_address_name || result.address_name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 선택된 주소 표시 */}
              {formData.address && formData.latitude !== 0 && formData.longitude !== 0 && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-green-800 dark:text-green-200">선택된 주소</div>
                      <div className="text-sm text-green-700 dark:text-green-300">{formData.address}</div>
                      <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                        좌표: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 상세 정보 */}
            <div className="bg-card rounded-2xl p-6 space-y-4">
              <h2 className="text-xl font-semibold mb-4">상세 정보</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">대표 메뉴/서비스</label>
                  <input
                    type="text"
                    name="signature_menu"
                    value={formData.signature_menu}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">전화번호</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">운영시간</label>
                  <input
                    type="text"
                    name="open_time"
                    value={formData.open_time}
                    onChange={handleInputChange}
                    placeholder="예: 09:00-22:00"
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">할인율 (%)</label>
                  <input
                    type="number"
                    name="discount_percentage"
                    value={formData.discount_percentage}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">특별 혜택</label>
                  <input
                    type="text"
                    name="special_offer"
                    value={formData.special_offer}
                    onChange={handleInputChange}
                    placeholder="예: 음료 1+1"
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* 이미지 업로드 */}
            <div className="bg-card rounded-2xl p-6 space-y-4">
              <h2 className="text-xl font-semibold mb-4">이미지</h2>
              
              {/* 로고 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  로고 이미지
                  <span className="text-xs text-muted-foreground ml-2">(최대 50KB)</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                {logoFile && (
                  <div className="mt-2">
                    <img
                      src={URL.createObjectURL(logoFile)}
                      alt="로고 미리보기"
                      className="w-20 h-20 object-cover rounded-full border border-border"
                    />
                  </div>
                )}
              </div>

              {/* 전경사진 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  전경사진 (여러 장 가능)
                  <span className="text-xs text-muted-foreground ml-2">(최대 200KB/장)</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesChange}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                {imageFiles.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {imageFiles.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`전경사진 ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push('/admin')}
                className="flex-1 px-6 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 font-medium"
              >
                {saving ? '등록 중...' : '스팟 등록'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

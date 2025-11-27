'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, MapPin, Search, Check, Store, Phone, Clock, Percent, Image as ImageIcon, X, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Script from 'next/script'

type Step = 'terms' | 'address' | 'basic' | 'details' | 'images' | 'complete'

export default function SpotRegisterPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>('terms')
  
  // 약관 동의
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    marketing: false
  })
  const [showModal, setShowModal] = useState<'terms' | 'privacy' | 'marketing' | null>(null)

  // 폼 데이터
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

  // 주소 검색
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<any>(null)

  // 이미지
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)

  // 카카오맵 SDK 로드
  useEffect(() => {
    const checkKakaoMaps = setInterval(() => {
      if ((window as any).kakao?.maps?.services) {
        console.log('✅ 카카오맵 SDK 로드 완료')
        clearInterval(checkKakaoMaps)
      }
    }, 100)
    return () => clearInterval(checkKakaoMaps)
  }, [])

  // 주소 검색
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
    setSelectedPlace(result)
    setShowSearchResults(false)
  }

  // 로고 파일 선택 (크기 제한 없음, 자동 압축)
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.')
        e.target.value = ''
        return
      }
      setLogoFile(file)
    }
  }

  // 전경사진 파일 선택 (크기 제한 없음, 자동 압축)
  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles: File[] = []
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        alert(`"${file.name}"은 이미지 파일이 아닙니다.`)
        continue
      }
      validFiles.push(file)
    }
    
    if (validFiles.length > 0) {
      setImageFiles(prev => [...prev, ...validFiles])
    }
  }

  // 이미지 압축
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

  const fileToBase64 = async (file: File): Promise<string> => {
    const isLogo = file === logoFile
    const maxWidth = isLogo ? 200 : 800
    const maxHeight = isLogo ? 200 : 600
    const quality = isLogo ? 0.9 : 0.8
    
    return await compressImage(file, maxWidth, maxHeight, quality)
  }

  // 최종 제출
  const handleSubmit = async () => {
    if (!formData.name || !formData.address) {
      alert('필수 정보를 모두 입력해주세요.')
      return
    }

    setSaving(true)
    try {
      const [logoUrl, ...imageUrls] = await Promise.all([
        logoFile ? fileToBase64(logoFile) : Promise.resolve(''),
        ...imageFiles.map(file => fileToBase64(file))
      ])

      const spotData = {
        name: formData.name,
        category: formData.category,
        description: formData.description || '',
        signature_menu: formData.signature_menu || '',
        address: formData.address,
        phone: formData.phone || '',
        open_time: formData.open_time || '정보 없음',
        discount_percentage: formData.discount_percentage ? parseInt(formData.discount_percentage) : 0,
        special_offer: formData.special_offer || '',
        latitude: formData.latitude,
        longitude: formData.longitude,
        logo_url: logoUrl,
        images: imageUrls,
        is_active: false,
        agreed_to_terms: agreements.terms,
        agreed_to_privacy: agreements.privacy,
        agreed_to_marketing: agreements.marketing,
        agreed_at: new Date().toISOString()
      }

      const { error } = await (supabase as any)
        .from('spots')
        .insert([spotData])

      if (error) {
        console.error('스팟 등록 오류:', error)
        alert('스팟 등록 중 오류가 발생했습니다.')
      } else {
        setCurrentStep('complete')
      }
    } catch (error) {
      console.error('스팟 등록 실패:', error)
      alert('스팟 등록 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // 다음 단계로
  const goToNextStep = () => {
    if (currentStep === 'terms') {
      if (!agreements.terms || !agreements.privacy) {
        alert('필수 약관에 동의해주세요.')
        return
      }
      setCurrentStep('address')
    } else if (currentStep === 'address') {
      if (!formData.address || formData.latitude === 0) {
        alert('주소를 검색하고 선택해주세요.')
        return
      }
      setCurrentStep('basic')
    } else if (currentStep === 'basic') {
      // 기본 정보 필수 항목 체크
      const missingFields = []
      if (!formData.name.trim()) missingFields.push('가게 이름')
      if (!formData.description.trim()) missingFields.push('가게 소개')
      
      if (missingFields.length > 0) {
        alert(`다음 항목을 입력해주세요:\n\n${missingFields.map(field => `• ${field}`).join('\n')}`)
        return
      }
      setCurrentStep('details')
    } else if (currentStep === 'details') {
      // 상세 정보 필수 항목 체크
      const missingFields = []
      if (!formData.signature_menu.trim()) missingFields.push('대표 메뉴/서비스')
      if (!formData.phone.trim()) missingFields.push('전화번호')
      if (!formData.open_time.trim()) missingFields.push('운영시간')
      if (!formData.discount_percentage || formData.discount_percentage === '0') missingFields.push('할인율')
      
      if (missingFields.length > 0) {
        alert(`다음 항목을 입력해주세요:\n\n${missingFields.map(field => `• ${field}`).join('\n')}`)
        return
      }
      setCurrentStep('images')
    } else if (currentStep === 'images') {
      handleSubmit()
    }
  }

  const goToPrevStep = () => {
    const steps: Step[] = ['terms', 'address', 'basic', 'details', 'images']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }

  const getStepNumber = () => {
    const steps: Step[] = ['terms', 'address', 'basic', 'details', 'images']
    return steps.indexOf(currentStep) + 1
  }

  // 약관 내용
  const termsContent = {
    terms: {
      title: '이용약관',
      content: `제1조 (목적)
본 약관은 RunSpot(이하 "회사")이 제공하는 제휴 스팟 등록 서비스(이하 "서비스")의 이용과 관련하여 회사와 제휴 파트너 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (정의)
1. "제휴 스팟"이란 회사의 플랫폼에 등록되어 RunSpot 사용자에게 할인 혜택을 제공하는 가맹점을 의미합니다.
2. "제휴 파트너"란 본 약관에 동의하고 제휴 스팟을 등록한 사업자를 의미합니다.
3. "사용자"란 RunSpot 앱을 이용하는 러너를 의미합니다.

제3조 (서비스의 내용)
1. 회사는 제휴 파트너의 매장 정보를 RunSpot 플랫폼에 노출합니다.
2. 제휴 파트너는 RunSpot 사용자에게 약정된 할인 혜택을 제공합니다.
3. 회사는 사용자의 완주 기록을 확인하여 쿠폰을 발급합니다.

제4조 (제휴 파트너의 의무)
1. 제휴 파트너는 등록한 정보가 정확하고 최신임을 보증합니다.
2. 제휴 파트너는 약정된 할인 혜택을 성실히 제공해야 합니다.
3. 제휴 파트너는 사용자에게 불합리한 차별을 해서는 안 됩니다.

제5조 (수수료 및 비용)
1. 제휴 스팟 등록 및 유지에는 별도의 수수료가 발생하지 않습니다.
2. 제휴 파트너는 약정된 할인율만큼만 부담하며, 추가 비용은 없습니다.

제6조 (계약의 해지)
1. 제휴 파트너는 언제든지 제휴를 해지할 수 있습니다.
2. 회사는 제휴 파트너가 본 약관을 위반한 경우 제휴를 해지할 수 있습니다.

제7조 (면책조항)
회사는 천재지변, 시스템 장애 등 불가항력으로 인한 서비스 중단에 대해 책임을 지지 않습니다.

제8조 (분쟁 해결)
본 약관과 관련된 분쟁은 대한민국 법률에 따라 해결합니다.`
    },
    privacy: {
      title: '개인정보 수집 및 이용 동의',
      content: `RunSpot은 제휴 스팟 등록을 위해 다음과 같이 개인정보를 수집 및 이용합니다.

1. 수집하는 개인정보 항목
- 필수항목: 가게명, 주소, 전화번호, 대표자명, 사업자등록번호
- 선택항목: 가게 소개, 대표 메뉴, 운영시간, 로고 이미지, 매장 사진

2. 개인정보의 수집 및 이용 목적
- 제휴 스팟 등록 및 관리
- 할인 쿠폰 발급 및 사용 확인
- 제휴 파트너와의 연락 및 공지사항 전달
- 서비스 개선 및 통계 분석
- 부정 이용 방지 및 분쟁 해결

3. 개인정보의 보유 및 이용 기간
- 제휴 계약 종료 후 3개월까지 보관
- 관계 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간까지 보관
  · 계약 또는 청약철회 등에 관한 기록: 5년
  · 대금결제 및 재화 등의 공급에 관한 기록: 5년
  · 소비자의 불만 또는 분쟁처리에 관한 기록: 3년

4. 개인정보 제공 거부 권리
귀하는 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있습니다. 다만, 필수항목에 대한 동의를 거부하실 경우 제휴 스팟 등록이 제한될 수 있습니다.

5. 개인정보의 안전성 확보 조치
RunSpot은 개인정보보호법 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적/관리적 조치를 하고 있습니다.
- 개인정보 암호화
- 해킹 등에 대비한 기술적 대책
- 개인정보 취급 직원의 최소화 및 교육
- 개인정보보호 전담기구의 운영

6. 개인정보 보호책임자
성명: 채정욱
연락처: pab.jeonguk@gmail.com

본 동의는 제휴 스팟 등록 시점부터 효력이 발생합니다.`
    },
    marketing: {
      title: '마케팅 정보 수신 동의',
      content: `RunSpot은 제휴 파트너에게 더 나은 서비스와 혜택을 제공하기 위해 마케팅 정보를 발송하고자 합니다.

1. 마케팅 정보 수신 동의
본 동의는 선택사항이며, 동의하지 않으셔도 제휴 스팟 등록 및 이용에는 제한이 없습니다.

2. 수신하는 마케팅 정보의 내용
- 제휴 프로모션 및 이벤트 안내
- 신규 서비스 및 기능 소개
- 할인 혜택 및 쿠폰 정보
- 사용자 통계 및 트렌드 리포트
- 제휴 파트너 성공 사례 공유
- 시즌별 마케팅 제안

3. 마케팅 정보 발송 방법
- 이메일
- 문자메시지(SMS/LMS)
- 앱 푸시 알림
- 전화

4. 마케팅 정보 수신 동의 철회
- 수신 동의는 언제든지 철회 가능합니다
- 철회 방법: 
  · 수신한 이메일/문자의 수신거부 링크 클릭
  · RunSpot 앱 내 설정에서 변경
  · 고객센터 문의 (pab.jeonguk@gmail.com)

5. 개인정보의 보유 및 이용 기간
마케팅 정보 수신 동의 철회 시 또는 제휴 계약 종료 시까지 보유 및 이용됩니다.

6. 동의 거부 권리 및 불이익
귀하는 마케팅 정보 수신에 대한 동의를 거부할 권리가 있으며, 동의하지 않으셔도 제휴 스팟 등록 및 기본 서비스 이용에는 아무런 제한이 없습니다.

본 동의는 제휴 스팟 등록 시점부터 효력이 발생하며, 동의 철회 시까지 유효합니다.`
    }
  }

  return (
    <>
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&libraries=services&autoload=false`}
        strategy="afterInteractive"
        onLoad={() => {
          (window as any).kakao.maps.load(() => {
            console.log('✅ 카카오맵 SDK 로드 완료')
          })
        }}
      />

      {/* 약관 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl sm:text-2xl font-black">{termsContent[showModal].title}</h2>
              <button
                onClick={() => setShowModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans">
                {termsContent[showModal].content}
              </pre>
            </div>
            <div className="p-4 sm:p-6 border-t border-gray-200 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowModal(null)}
                className="w-full px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-white">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={() => router.push('/about')}
                className="flex items-center text-gray-600 hover:text-black transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="text-sm sm:text-base">뒤로</span>
              </button>
              {currentStep !== 'complete' && (
                <div className="text-sm font-medium text-gray-600">
                  {getStepNumber()} / 5
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 진행 바 */}
        {currentStep !== 'complete' && (
          <div className="bg-gray-100 h-1">
            <div 
              className="bg-black h-full transition-all duration-300"
              style={{ width: `${(getStepNumber() / 5) * 100}%` }}
            />
          </div>
        )}

        {/* 메인 컨텐츠 */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Step 1: 약관 동의 */}
          {currentStep === 'terms' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black mb-2">
                  제휴 스팟 등록을 시작합니다
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  먼저 약관에 동의해주세요
                </p>
              </div>

              <div className="space-y-3">
                {/* 전체 동의 */}
                <div className="p-4 sm:p-5 bg-gray-50 rounded-xl border-2 border-gray-200">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex-shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        checked={agreements.terms && agreements.privacy && agreements.marketing}
                        onChange={(e) => {
                          const checked = e.target.checked
                          setAgreements({
                            terms: checked,
                            privacy: checked,
                            marketing: checked
                          })
                        }}
                        className="w-5 h-5 rounded border-2 border-gray-300 checked:bg-black checked:border-black appearance-none cursor-pointer"
                      />
                      {agreements.terms && agreements.privacy && agreements.marketing && (
                        <Check className="w-3 h-3 text-white absolute top-1 left-1 pointer-events-none" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-base sm:text-lg">전체 동의</div>
                      <div className="text-xs sm:text-sm text-gray-600 mt-0.5">
                        모든 약관에 동의합니다
                      </div>
                    </div>
                  </label>
                </div>

                {/* 개별 약관 */}
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
                    <label className="flex items-start gap-3 flex-1 cursor-pointer">
                      <div className="relative flex-shrink-0 mt-0.5">
                        <input
                          type="checkbox"
                          checked={agreements.terms}
                          onChange={(e) => setAgreements(prev => ({ ...prev, terms: e.target.checked }))}
                          className="w-4 h-4 rounded border-2 border-gray-300 checked:bg-black checked:border-black appearance-none cursor-pointer"
                        />
                        {agreements.terms && (
                          <Check className="w-2.5 h-2.5 text-white absolute top-0.5 left-0.5 pointer-events-none" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm sm:text-base">
                          <span className="text-red-500">[필수]</span> 이용약관 동의
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 mt-0.5">
                          RunSpot 제휴 스팟 서비스 이용약관에 동의합니다
                        </div>
                      </div>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowModal('terms')}
                      className="text-xs sm:text-sm text-gray-500 underline hover:text-black transition-colors whitespace-nowrap mt-0.5"
                    >
                      보기
                    </button>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
                    <label className="flex items-start gap-3 flex-1 cursor-pointer">
                      <div className="relative flex-shrink-0 mt-0.5">
                        <input
                          type="checkbox"
                          checked={agreements.privacy}
                          onChange={(e) => setAgreements(prev => ({ ...prev, privacy: e.target.checked }))}
                          className="w-4 h-4 rounded border-2 border-gray-300 checked:bg-black checked:border-black appearance-none cursor-pointer"
                        />
                        {agreements.privacy && (
                          <Check className="w-2.5 h-2.5 text-white absolute top-0.5 left-0.5 pointer-events-none" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm sm:text-base">
                          <span className="text-red-500">[필수]</span> 개인정보 수집 및 이용 동의
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 mt-0.5">
                          제휴 스팟 등록을 위한 개인정보 수집 및 이용에 동의합니다
                        </div>
                      </div>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowModal('privacy')}
                      className="text-xs sm:text-sm text-gray-500 underline hover:text-black transition-colors whitespace-nowrap mt-0.5"
                    >
                      보기
                    </button>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
                    <label className="flex items-start gap-3 flex-1 cursor-pointer">
                      <div className="relative flex-shrink-0 mt-0.5">
                        <input
                          type="checkbox"
                          checked={agreements.marketing}
                          onChange={(e) => setAgreements(prev => ({ ...prev, marketing: e.target.checked }))}
                          className="w-4 h-4 rounded border-2 border-gray-300 checked:bg-black checked:border-black appearance-none cursor-pointer"
                        />
                        {agreements.marketing && (
                          <Check className="w-2.5 h-2.5 text-white absolute top-0.5 left-0.5 pointer-events-none" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm sm:text-base">
                          <span className="text-gray-500">[선택]</span> 마케팅 정보 수신 동의
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 mt-0.5">
                          제휴 혜택 및 이벤트 정보를 받아보실 수 있습니다
                        </div>
                      </div>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowModal('marketing')}
                      className="text-xs sm:text-sm text-gray-500 underline hover:text-black transition-colors whitespace-nowrap mt-0.5"
                    >
                      보기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: 주소 검색 */}
          {currentStep === 'address' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black mb-2">
                  가게 주소가 어떻게 되나요?
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  정확한 위치를 검색해주세요
                </p>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), searchAddress(searchQuery))}
                        placeholder="가게 이름이나 주소를 입력하세요"
                        className="w-full pl-10 pr-3 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black text-sm sm:text-base"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => searchAddress(searchQuery)}
                      disabled={isSearching}
                      className="px-4 sm:px-5 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 font-semibold text-sm sm:text-base whitespace-nowrap"
                    >
                      {isSearching ? '검색 중' : '검색'}
                    </button>
                  </div>

                  {/* 검색 결과 */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto">
                      {searchResults.map((result, index) => (
                        <div
                          key={index}
                          onClick={() => selectSearchResult(result)}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <div className="font-semibold text-sm sm:text-base">{result.place_name}</div>
                          <div className="text-xs sm:text-sm text-gray-600 mt-0.5">
                            {result.road_address_name || result.address_name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 선택된 주소 */}
                {formData.address && formData.latitude !== 0 && selectedPlace && (
                  <div className="p-4 bg-gray-50 border-2 border-gray-300 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 text-sm sm:text-base mb-1">선택된 주소</div>
                        <div className="text-gray-700 font-medium text-sm mb-0.5">{selectedPlace.place_name}</div>
                        <div className="text-xs text-gray-600">
                          {selectedPlace.road_address_name || selectedPlace.address_name}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: 기본 정보 */}
          {currentStep === 'basic' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black mb-2">
                  가게 기본 정보를 알려주세요
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  고객들에게 보여질 정보입니다
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-sm sm:text-base mb-2">
                    가게 이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="예: 런너스 카페"
                    className="w-full px-3 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-sm sm:text-base mb-2">
                    카테고리
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black text-sm sm:text-base"
                  >
                    <option value="restaurant">음식점</option>
                    <option value="cafe">카페</option>
                    <option value="fitness">피트니스</option>
                    <option value="retail">소매점</option>
                    <option value="service">서비스</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-sm sm:text-base mb-2">
                    가게 소개 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="가게를 소개해주세요"
                    rows={3}
                    className="w-full px-3 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black text-sm sm:text-base resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: 상세 정보 */}
          {currentStep === 'details' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black mb-2">
                  상세 정보를 입력해주세요
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  더 많은 정보를 제공할수록 좋아요
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-lg mb-3 flex items-center gap-2">
                    <Store className="w-5 h-5" />
                    대표 메뉴/서비스 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.signature_menu}
                    onChange={(e) => setFormData(prev => ({ ...prev, signature_menu: e.target.value }))}
                    placeholder="예: 아메리카노, 샐러드"
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-black text-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-lg mb-3 flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    전화번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="예: 02-1234-5678"
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-black text-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-lg mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    운영시간 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.open_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, open_time: e.target.value }))}
                    placeholder="예: 09:00-22:00"
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-black text-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-lg mb-3 flex items-center gap-2">
                      <Percent className="w-5 h-5" />
                      할인율 (%) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount_percentage: e.target.value }))}
                      placeholder="10"
                      min="0"
                      max="100"
                      className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-black text-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-lg mb-3">
                      특별 혜택
                    </label>
                    <input
                      type="text"
                      value={formData.special_offer}
                      onChange={(e) => setFormData(prev => ({ ...prev, special_offer: e.target.value }))}
                      placeholder="예: 음료 1+1"
                      className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-black text-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: 이미지 업로드 */}
          {currentStep === 'images' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black mb-2">
                  가게 사진을 올려주세요
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  사진이 있으면 더 많은 고객이 방문해요
                </p>
              </div>

              <div className="space-y-4">
                {/* 로고 */}
                <div>
                  <label className="block font-semibold text-lg mb-3 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    로고 이미지
                    <span className="text-sm text-gray-500 font-normal">(크기 제한 없음, 자동 압축)</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-black file:text-white hover:file:bg-gray-800 file:font-semibold cursor-pointer"
                  />
                  {logoFile && (
                    <div className="mt-4">
                      <img
                        src={URL.createObjectURL(logoFile)}
                        alt="로고 미리보기"
                        className="w-24 h-24 object-cover rounded-2xl border-2 border-gray-200"
                      />
                    </div>
                  )}
                </div>

                {/* 전경사진 */}
                <div>
                  <label className="block font-semibold text-lg mb-3 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    가게 사진 (여러 장 가능)
                    <span className="text-sm text-gray-500 font-normal">(크기 제한 없음, 자동 압축)</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImagesChange}
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-black file:text-white hover:file:bg-gray-800 file:font-semibold cursor-pointer"
                  />
                  {imageFiles.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {imageFiles.map((file, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`사진 ${index + 1}`}
                            className="w-full h-32 object-cover rounded-xl border-2 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => setImageFiles(prev => prev.filter((_, i) => i !== index))}
                            className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full text-sm hover:bg-red-600 font-bold"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 완료 화면 */}
          {currentStep === 'complete' && (
            <div className="text-center space-y-6 py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              
              <div>
                <h1 className="text-2xl sm:text-3xl font-black mb-2">
                  등록이 완료되었습니다!
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  검토 후 승인되면 RunSpot에 노출됩니다
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => router.push('/')}
                  className="w-full px-6 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-semibold text-lg"
                >
                  홈으로 가기
                </button>
                <button
                  onClick={() => router.push('/about')}
                  className="w-full px-6 py-4 bg-gray-100 text-black rounded-xl hover:bg-gray-200 transition-colors font-semibold text-lg"
                >
                  소개 페이지로
                </button>
              </div>
            </div>
          )}

          {/* 버튼 영역 */}
          {currentStep !== 'complete' && (
            <div className="flex gap-3 pt-6">
              {currentStep !== 'terms' && (
                <button
                  onClick={goToPrevStep}
                  className="flex-1 px-5 py-3 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors font-semibold text-sm sm:text-base"
                >
                  이전
                </button>
              )}
              <button
                onClick={goToNextStep}
                disabled={saving}
                className="flex-1 px-5 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 font-semibold text-sm sm:text-base flex items-center justify-center gap-2"
              >
                {saving ? '등록 중...' : currentStep === 'images' ? '등록 완료' : '다음'}
                {!saving && currentStep !== 'images' && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

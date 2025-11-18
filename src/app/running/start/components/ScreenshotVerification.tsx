'use client'

import { useState } from 'react'
import { Camera, Upload, X, CheckCircle, AlertCircle } from 'lucide-react'
import { analyzeScreenshot, preprocessImage } from '@/services/ocrAnalysis'

interface ScreenshotVerificationProps {
  onClose: () => void
  onVerificationComplete: (result: any) => void
}

export default function ScreenshotVerification({ onClose, onVerificationComplete }: ScreenshotVerificationProps) {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState('')
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [dragActive, setDragActive] = useState(false)

  // 이미지 파일 처리
  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB 제한
      alert('파일 크기는 10MB 이하여야 합니다.')
      return
    }

    setUploadedImage(file)
    
    // 이미지 미리보기 생성
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // 파일 입력 처리
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  // 드래그 앤 드롭 처리
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  // 이미지 분석 시작
  const handleAnalyzeImage = async () => {
    if (!uploadedImage) return

    setIsProcessing(true)
    
    try {
      console.log('🔍 이미지 분석 시작:', uploadedImage.name)
      
      // 이미지 전처리 (선택적)
      setProcessingStep('이미지 전처리 중...')
      const processedImage = await preprocessImage(uploadedImage)
      console.log('🖼️ 이미지 전처리 완료')
      
      // 실제 OCR 분석 실행
      setProcessingStep('텍스트 인식 중...')
      const ocrResult = await analyzeScreenshot(processedImage)
      console.log('📊 OCR 분석 결과:', ocrResult)
      
      setProcessingStep('데이터 검증 중...')
      
      // 결과를 UI에 맞는 형태로 변환
      const result = {
        verified: ocrResult.verified,
        confidence: ocrResult.confidence,
        extractedData: {
          distance: ocrResult.extractedData.distance || '정보 없음',
          duration: ocrResult.extractedData.duration || '정보 없음',
          averageSpeed: ocrResult.extractedData.averageSpeed || '정보 없음',
          completedAt: ocrResult.extractedData.completedAt || new Date().toLocaleString()
        },
        issues: ocrResult.issues,
        rawText: ocrResult.rawText
      }
      
      setVerificationResult(result)
      
      if (result.verified) {
        // 성공 시 3초 후 자동으로 완료 처리
        setTimeout(() => {
          onVerificationComplete(result)
        }, 3000)
      }
      
    } catch (error) {
      console.error('❌ 이미지 분석 실패:', error)
      
      // 오류 발생 시 사용자에게 표시할 결과
      const errorResult = {
        verified: false,
        confidence: 0,
        extractedData: {
          distance: '분석 실패',
          duration: '분석 실패',
          averageSpeed: '분석 실패',
          completedAt: new Date().toLocaleString()
        },
        issues: ['이미지 분석 중 오류가 발생했습니다. 이미지가 선명한지 확인하고 다시 시도해주세요.'],
        rawText: ''
      }
      
      setVerificationResult(errorResult)
      
    } finally {
      setIsProcessing(false)
    }
  }

  // 이미지 제거
  const handleRemoveImage = () => {
    setUploadedImage(null)
    setImagePreview(null)
    setVerificationResult(null)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">스크린샷 인증</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {!uploadedImage ? (
            /* 업로드 영역 */
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="mb-4">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <Upload className="w-8 h-8 text-gray-400 mx-auto" />
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                카카오맵 완주 화면을 업로드하세요
              </h3>
              
              <p className="text-sm text-gray-600 mb-6">
                거리, 시간, 경로가 표시된 완주 화면을 촬영해주세요
              </p>

              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                  id="screenshot-upload"
                />
                <label
                  htmlFor="screenshot-upload"
                  className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl cursor-pointer transition-colors"
                >
                  파일 선택
                </label>
                
                <p className="text-xs text-gray-500">
                  또는 파일을 여기로 드래그하세요
                </p>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 font-medium mb-2">📋 체크리스트</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✓ 카카오맵 완주 화면이 선명하게 보임</li>
                  <li>✓ 거리, 시간 정보가 명확히 표시됨</li>
                  <li>✓ 경로 지도가 포함되어 있음</li>
                  <li>✓ 화면이 잘리지 않음</li>
                </ul>
              </div>
            </div>
          ) : (
            /* 업로드된 이미지 표시 */
            <div className="space-y-4">
              {/* 이미지 미리보기 */}
              <div className="relative">
                <img
                  src={imagePreview!}
                  alt="업로드된 스크린샷"
                  className="w-full rounded-xl border"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 분석 결과 */}
              {verificationResult ? (
                <div className={`p-4 rounded-xl ${
                  verificationResult.verified 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    {verificationResult.verified ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    )}
                    <h3 className={`font-bold ${
                      verificationResult.verified ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {verificationResult.verified ? '인증 성공!' : '인증 실패'}
                    </h3>
                  </div>

                  {verificationResult.verified ? (
                    <div className="space-y-2">
                      <p className="text-sm text-green-600">
                        카카오맵 완주 화면이 확인되었습니다
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white p-2 rounded">
                          <span className="text-gray-600">거리: </span>
                          <span className="font-medium">{verificationResult.extractedData.distance}</span>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <span className="text-gray-600">시간: </span>
                          <span className="font-medium">{verificationResult.extractedData.duration}</span>
                        </div>
                      </div>
                      <p className="text-xs text-green-600 mt-2">
                        잠시 후 자동으로 완료됩니다...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-red-600">
                        이미지에서 완주 정보를 확인할 수 없습니다
                      </p>
                      {verificationResult.issues.length > 0 && (
                        <ul className="text-xs text-red-600 space-y-1">
                          {verificationResult.issues.map((issue: string, index: number) => (
                            <li key={index}>• {issue}</li>
                          ))}
                        </ul>
                      )}
                      <button
                        onClick={handleRemoveImage}
                        className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded mt-2"
                      >
                        다른 이미지 업로드
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* 분석 버튼 */
                <button
                  onClick={handleAnalyzeImage}
                  disabled={isProcessing}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {processingStep || '이미지 분석 중...'}
                    </>
                  ) : (
                    '완주 화면 분석하기'
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

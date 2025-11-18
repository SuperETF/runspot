'use client'

import { createWorker } from 'tesseract.js'

export interface OCRResult {
  verified: boolean
  confidence: number
  extractedData: {
    distance?: string
    duration?: string
    averageSpeed?: string
    completedAt?: string
  }
  issues: string[]
  rawText: string
}

// 카카오맵 UI 패턴 검증
function validateKakaoMapUI(text: string): { isValid: boolean; confidence: number; detectedElements: string[] } {
  const kakaoMapSignatures = [
    '카카오맵', 'kakao', 'map',
    '도착', '완주', '완료',
    'km', '분', '시간', '거리', '속도',
    '경로', '네비게이션', '길찾기'
  ]
  
  const normalizedText = text.toLowerCase().replace(/\s+/g, '')
  const detectedSignatures = kakaoMapSignatures.filter(sig => 
    normalizedText.includes(sig.toLowerCase())
  )
  
  const confidence = detectedSignatures.length / kakaoMapSignatures.length
  
  return {
    isValid: detectedSignatures.length >= 3, // 최소 3개 이상의 시그니처 필요
    confidence,
    detectedElements: detectedSignatures
  }
}

// 운동 데이터 추출
function extractExerciseData(text: string): {
  distance?: string
  duration?: string
  averageSpeed?: string
  pace?: string
  calories?: string
} {
  const extractedData: any = {}
  
  // 거리 패턴 (예: "5.2km", "3.45 km", "10.0킬로미터")
  const distancePatterns = [
    /(\d+\.?\d*)\s*km/gi,
    /(\d+\.?\d*)\s*킬로미터/gi,
    /거리[:\s]*(\d+\.?\d*)\s*km/gi
  ]
  
  for (const pattern of distancePatterns) {
    const match = text.match(pattern)
    if (match) {
      extractedData.distance = match[0].trim()
      break
    }
  }
  
  // 시간 패턴 (예: "25분 30초", "1시간 15분", "01:25:30")
  const timePatterns = [
    /(\d+)시간\s*(\d+)분/gi,
    /(\d+)분\s*(\d+)초/gi,
    /(\d{1,2}):(\d{2}):(\d{2})/gi,
    /(\d{1,2}):(\d{2})/gi,
    /시간[:\s]*(\d+)분\s*(\d+)초/gi
  ]
  
  for (const pattern of timePatterns) {
    const match = text.match(pattern)
    if (match) {
      extractedData.duration = match[0].trim()
      break
    }
  }
  
  // 속도 패턴 (예: "12.5km/h", "평균 속도 15km/h")
  const speedPatterns = [
    /(\d+\.?\d*)\s*km\/h/gi,
    /속도[:\s]*(\d+\.?\d*)\s*km\/h/gi,
    /평균[:\s]*(\d+\.?\d*)\s*km\/h/gi
  ]
  
  for (const pattern of speedPatterns) {
    const match = text.match(pattern)
    if (match) {
      extractedData.averageSpeed = match[0].trim()
      break
    }
  }
  
  // 페이스 패턴 (예: "5'30"", "4분 20초/km")
  const pacePatterns = [
    /(\d+)'(\d+)"/gi,
    /(\d+)분\s*(\d+)초\/km/gi,
    /페이스[:\s]*(\d+)'(\d+)"/gi
  ]
  
  for (const pattern of pacePatterns) {
    const match = text.match(pattern)
    if (match) {
      extractedData.pace = match[0].trim()
      break
    }
  }
  
  // 칼로리 패턴 (예: "250kcal", "300 칼로리")
  const caloriePatterns = [
    /(\d+)\s*kcal/gi,
    /(\d+)\s*칼로리/gi,
    /칼로리[:\s]*(\d+)/gi
  ]
  
  for (const pattern of caloriePatterns) {
    const match = text.match(pattern)
    if (match) {
      extractedData.calories = match[0].trim()
      break
    }
  }
  
  return extractedData
}

// 데이터 유효성 검증
function validateExtractedData(data: any): { isValid: boolean; issues: string[] } {
  const issues: string[] = []
  
  // 필수 데이터 확인
  if (!data.distance && !data.duration) {
    issues.push('거리 또는 시간 정보를 찾을 수 없습니다')
  }
  
  if (!data.distance) {
    issues.push('거리 정보가 명확하지 않습니다')
  }
  
  if (!data.duration) {
    issues.push('시간 정보가 명확하지 않습니다')
  }
  
  // 거리 유효성 검사
  if (data.distance) {
    const distanceMatch = data.distance.match(/(\d+\.?\d*)/);
    if (distanceMatch) {
      const distanceValue = parseFloat(distanceMatch[1]);
      if (distanceValue < 0.1) {
        issues.push('거리가 너무 짧습니다 (0.1km 미만)')
      } else if (distanceValue > 100) {
        issues.push('거리가 비현실적으로 깁니다 (100km 초과)')
      }
    }
  }
  
  return {
    isValid: issues.length <= 1, // 1개 이하의 문제만 허용
    issues
  }
}

// 메인 OCR 분석 함수
export async function analyzeScreenshot(imageFile: File): Promise<OCRResult> {
  let worker: Tesseract.Worker | null = null
  
  try {
    console.log('🔍 OCR 분석 시작:', imageFile.name)
    
    // Tesseract 워커 생성
    worker = await createWorker('kor+eng', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`OCR 진행률: ${Math.round(m.progress * 100)}%`)
        }
      }
    })
    
    // 이미지 전처리 옵션 설정
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ가-힣ㄱ-ㅎㅏ-ㅣ:./\'\"분초시간거리속도칼로리완주도착km',
      tessedit_pageseg_mode: 6 as any, // 단일 텍스트 블록
    })
    
    // OCR 실행
    const { data: { text, confidence } } = await worker.recognize(imageFile)
    
    console.log('📝 추출된 텍스트:', text)
    console.log('🎯 OCR 신뢰도:', confidence)
    
    // 카카오맵 UI 검증
    const uiValidation = validateKakaoMapUI(text)
    console.log('🗺️ 카카오맵 UI 검증:', uiValidation)
    
    // 운동 데이터 추출
    const extractedData = extractExerciseData(text)
    console.log('📊 추출된 데이터:', extractedData)
    
    // 데이터 유효성 검증
    const dataValidation = validateExtractedData(extractedData)
    console.log('✅ 데이터 검증:', dataValidation)
    
    // 종합 평가
    const issues: string[] = []
    
    if (!uiValidation.isValid) {
      issues.push('카카오맵 화면으로 인식되지 않습니다')
    }
    
    if (confidence < 60) {
      issues.push('이미지가 흐릿하거나 텍스트가 명확하지 않습니다')
    }
    
    issues.push(...dataValidation.issues)
    
    // 최종 검증 결과
    const verified = Boolean(uiValidation.isValid && 
                    dataValidation.isValid && 
                    confidence > 50 &&
                    (extractedData.distance || extractedData.duration))
    
    // 신뢰도 계산 (여러 요소 종합)
    const finalConfidence = Math.min(
      (confidence / 100) * 0.4 +           // OCR 신뢰도 40%
      uiValidation.confidence * 0.3 +      // UI 검증 30%
      (dataValidation.isValid ? 1 : 0.5) * 0.3  // 데이터 검증 30%
    , 1.0)
    
    return {
      verified,
      confidence: finalConfidence,
      extractedData: {
        ...extractedData,
        completedAt: new Date().toLocaleString()
      },
      issues,
      rawText: text
    }
    
  } catch (error) {
    console.error('❌ OCR 분석 실패:', error)
    
    return {
      verified: false,
      confidence: 0,
      extractedData: {},
      issues: ['이미지 분석 중 오류가 발생했습니다'],
      rawText: ''
    }
    
  } finally {
    // 워커 정리
    if (worker) {
      await worker.terminate()
    }
  }
}

// 이미지 전처리 함수 (선택적)
export function preprocessImage(imageFile: File): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    
    img.onload = () => {
      // 이미지 크기 조정 (OCR 성능 향상을 위해)
      const maxWidth = 1200
      const maxHeight = 1600
      
      let { width, height } = img
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }
      
      canvas.width = width
      canvas.height = height
      
      // 이미지 그리기
      ctx.drawImage(img, 0, 0, width, height)
      
      // 대비 향상 (OCR 성능 향상)
      const imageData = ctx.getImageData(0, 0, width, height)
      const data = imageData.data
      
      for (let i = 0; i < data.length; i += 4) {
        // 간단한 대비 향상
        data[i] = Math.min(255, data[i] * 1.2)     // R
        data[i + 1] = Math.min(255, data[i + 1] * 1.2) // G
        data[i + 2] = Math.min(255, data[i + 2] * 1.2) // B
      }
      
      ctx.putImageData(imageData, 0, 0)
      
      // 새로운 파일로 변환
      canvas.toBlob((blob) => {
        if (blob) {
          const processedFile = new File([blob], imageFile.name, {
            type: 'image/png'
          })
          resolve(processedFile)
        } else {
          resolve(imageFile) // 실패 시 원본 반환
        }
      }, 'image/png')
    }
    
    img.src = URL.createObjectURL(imageFile)
  })
}

// GPX 파일 파싱 유틸리티
import { XMLParser } from 'fast-xml-parser'
import { haversineDistance } from './navigationEngine'

export interface GPSPoint {
  lat: number
  lng: number
  elevation?: number
}

export interface GPXMetadata {
  name?: string
  description?: string
  time?: string
  creator?: string
}

export interface ParsedGPXData {
  points: GPSPoint[]
  metadata: GPXMetadata
  totalDistance: number
  startPoint: GPSPoint
  endPoint: GPSPoint
}

export async function parseGPXFile(gpxPath: string): Promise<GPSPoint[]> {
  try {
    const response = await fetch(gpxPath)
    if (!response.ok) {
      throw new Error(`GPX 파일을 불러올 수 없습니다: ${response.status}`)
    }
    
    const gpxText = await response.text()
    return parseGPXString(gpxText)
  } catch (error) {
    console.error('GPX 파일 로드 실패:', error)
    return []
  }
}

export function parseGPXString(gpxString: string): GPSPoint[] {
  try {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(gpxString, 'text/xml')
    
    // 파싱 에러 확인
    const parserError = xmlDoc.querySelector('parsererror')
    if (parserError) {
      throw new Error('GPX XML 파싱 오류')
    }
    
    const points: GPSPoint[] = []
    
    // trkpt (track points) 추출
    const trackPoints = xmlDoc.querySelectorAll('trkpt')
    trackPoints.forEach(point => {
      const lat = parseFloat(point.getAttribute('lat') || '0')
      const lon = parseFloat(point.getAttribute('lon') || '0')
      const eleElement = point.querySelector('ele')
      const elevation = eleElement ? parseFloat(eleElement.textContent || '0') : undefined
      
      if (lat !== 0 && lon !== 0) {
        points.push({
          lat,
          lng: lon,
          elevation
        })
      }
    })
    
    // wpt (waypoints) 추출 (트랙 포인트가 없는 경우)
    if (points.length === 0) {
      const waypoints = xmlDoc.querySelectorAll('wpt')
      waypoints.forEach(point => {
        const lat = parseFloat(point.getAttribute('lat') || '0')
        const lon = parseFloat(point.getAttribute('lon') || '0')
        
        if (lat !== 0 && lon !== 0) {
          points.push({
            lat,
            lng: lon
          })
        }
      })
    }
    
    console.log(`✅ GPX 파싱 완료: ${points.length}개 포인트`)
    return points
    
  } catch (error) {
    console.error('GPX 파싱 실패:', error)
    return []
  }
}

// GPX 경로를 간소화 (너무 많은 포인트가 있을 때)
export function simplifyGPXRoute(points: GPSPoint[], maxPoints: number = 100): GPSPoint[] {
  if (points.length <= maxPoints) {
    return points
  }
  
  const simplified: GPSPoint[] = []
  const step = Math.floor(points.length / maxPoints)
  
  for (let i = 0; i < points.length; i += step) {
    simplified.push(points[i])
  }
  
  // 마지막 포인트는 항상 포함
  if (simplified[simplified.length - 1] !== points[points.length - 1]) {
    simplified.push(points[points.length - 1])
  }
  
  console.log(`📊 GPX 경로 간소화: ${points.length} → ${simplified.length} 포인트`)
  return simplified
}

// 사용 가능한 GPX 파일 목록
export const AVAILABLE_GPX_FILES = {
  bucheon: '/gpx/bucheon.gpx',
  // 추후 다른 GPX 파일들 추가 가능
}

// 코스 ID에 따른 GPX 파일 매핑
export function getGPXFileForCourse(courseId: string): string | null {
  const gpxMapping: { [key: string]: string } = {
    '1': AVAILABLE_GPX_FILES.bucheon,
    '2': AVAILABLE_GPX_FILES.bucheon, // 임시로 같은 파일 사용
    '3': AVAILABLE_GPX_FILES.bucheon, // 임시로 같은 파일 사용
  }
  
  return gpxMapping[courseId] || null
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { XMLParser } from 'fast-xml-parser'

// Service Role Key를 사용한 Admin 전용 Supabase 클라이언트
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service Role Key 사용 (RLS 우회)
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const gpxFile = formData.get('gpxFile') as File
    
    if (!gpxFile) {
      return NextResponse.json({ error: 'GPX 파일이 필요합니다.' }, { status: 400 })
    }

    // GPX 파일 읽기
    const gpxText = await gpxFile.text()
    
    // fast-xml-parser로 GPX 파싱
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
    })
    
    let parsedData
    try {
      parsedData = parser.parse(gpxText)
    } catch (error) {
      return NextResponse.json({ error: 'GPX 파일 형식이 올바르지 않습니다.' }, { status: 400 })
    }
    
    // GPX 구조 확인
    if (!parsedData.gpx) {
      return NextResponse.json({ error: '유효한 GPX 파일이 아닙니다.' }, { status: 400 })
    }
    
    // 메타데이터에서 코스명 추출
    const metadata = parsedData.gpx.metadata
    const courseName = metadata?.name || gpxFile.name.replace('.gpx', '')
    
    // 트랙 포인트 추출
    const points: any[] = []
    const tracks = parsedData.gpx.trk
    
    if (tracks) {
      const trackArray = Array.isArray(tracks) ? tracks : [tracks]
      
      trackArray.forEach(track => {
        const segments = track.trkseg
        const segmentArray = Array.isArray(segments) ? segments : [segments]
        
        segmentArray.forEach(segment => {
          if (segment.trkpt) {
            const trackPoints = Array.isArray(segment.trkpt) ? segment.trkpt : [segment.trkpt]
            
            trackPoints.forEach(point => {
              const lat = parseFloat(point['@_lat'] || '0')
              const lng = parseFloat(point['@_lon'] || '0')
              
              if (lat !== 0 && lng !== 0) {
                points.push({ lat, lng })
              }
            })
          }
        })
      })
    }
    
    if (points.length === 0) {
      return NextResponse.json({ error: 'GPX 파일에서 유효한 GPS 포인트를 찾을 수 없습니다.' }, { status: 400 })
    }
    
    // 거리 계산 (Haversine 공식)
    let totalDistance = 0
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const R = 6371 // 지구 반지름 (km)
      const dLat = (curr.lat - prev.lat) * Math.PI / 180
      const dLng = (curr.lng - prev.lng) * Math.PI / 180
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(prev.lat * Math.PI / 180) * Math.cos(curr.lat * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      totalDistance += R * c
    }
    
    // 코스 데이터 생성 (created_by를 null로 설정)
    const courseData = {
      name: courseName,
      description: `GPX 파일에서 생성된 코스 (${points.length}개 포인트)`,
      gps_route: points,
      distance: Math.round(totalDistance * 100) / 100,
      duration: Math.round(totalDistance * 6), // 1km당 6분 가정
      difficulty: totalDistance < 3 ? 'easy' : totalDistance < 7 ? 'medium' : 'hard',
      course_type: 'urban',
      area: '업로드된 코스',
      created_by: null, // Admin 업로드는 null로 설정
      is_verified: true
    }
    
    // Service Role로 코스 저장 (RLS 우회)
    const { data: courseResult, error: courseError } = await supabaseAdmin
      .from('courses')
      .insert([courseData])
      .select()
      .single()
    
    if (courseError) {
      console.error('코스 저장 오류:', courseError)
      return NextResponse.json({ error: `코스 저장 실패: ${courseError.message}` }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      course: courseResult,
      message: `✅ GPX 파일에서 "${courseName}" 코스가 성공적으로 생성되었습니다!\n- 거리: ${totalDistance.toFixed(2)}km\n- 포인트: ${points.length}개`
    })
    
  } catch (error: any) {
    console.error('GPX 업로드 API 오류:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

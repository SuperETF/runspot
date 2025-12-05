import { Client } from '@notionhq/client'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})

const MEMBERS_DB_ID = process.env.NOTION_MEMBERS_DB_ID || ''

function getTextProperty(properties: any, key: string): string {
  const prop = properties[key]
  if (!prop) return ''
  
  if (prop.type === 'title') {
    return prop.title?.[0]?.plain_text || ''
  }
  if (prop.type === 'rich_text') {
    return prop.rich_text?.[0]?.plain_text || ''
  }
  return ''
}

function getNumberProperty(properties: any, key: string): number | null {
  const prop = properties[key]
  if (!prop || prop.type !== 'number') return null
  return prop.number
}

function getCheckboxProperty(properties: any, key: string): boolean {
  const prop = properties[key]
  if (!prop || prop.type !== 'checkbox') return false
  return prop.checkbox
}

function getSelectProperty(properties: any, key: string): string {
  const prop = properties[key]
  if (!prop || prop.type !== 'select' || !prop.select) return ''
  return prop.select.name || ''
}

function getUrlProperty(properties: any, key: string): string | null {
  const prop = properties[key]
  if (!prop || prop.type !== 'url') return null
  return prop.url
}

// 이름 마스킹: 홍길동 -> 홍*동, 김철수 -> 김*수
function maskName(name: string): string {
  if (!name || name.length < 2) return name
  if (name.length === 2) {
    return name[0] + '*'
  }
  // 3글자 이상: 첫글자 + * + 마지막글자
  return name[0] + '*' + name[name.length - 1]
}

// GET: 활성 멤버 조회 (lookup=true면 전체 정보, 아니면 마스킹)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const lookup = searchParams.get('lookup') === 'true' // 크루원 조회용

    const response = await notion.databases.query({
      database_id: MEMBERS_DB_ID,
      filter: {
        property: '활성',
        checkbox: { equals: true }
      }
    })
    
    const members = response.results.map((page: any) => {
      const props = page.properties
      const role = getSelectProperty(props, '역할')
      const originalName = getTextProperty(props, '이름')
      const phone = getNumberProperty(props, '전화번호')
      const kakaoId = getTextProperty(props, '카카오ID')
      
      // lookup 모드면 마스킹 안함, 아니면 멤버만 마스킹
      const displayName = lookup ? originalName : (role === '멤버' ? maskName(originalName) : originalName)
      
      // 전화번호 뒷자리 4자리만 표시
      const phoneHint = phone ? `***${String(phone).slice(-4)}` : null
      
      return {
        id: page.id,
        name: displayName,
        role: role,
        pace: getTextProperty(props, '페이스') || null,
        main_distance: getTextProperty(props, '주력 거리') || null,
        profile_image: getUrlProperty(props, '프로필 이미지'),
        link_url: getUrlProperty(props, '링크'),
        order: getNumberProperty(props, '순서') || 999,
        is_active: true,
        // lookup 모드에서만 연락처 힌트 제공
        ...(lookup && { phoneHint, kakaoId: kakaoId || null, phone: phone ? String(phone) : null })
      }
    })

    // 역할 순서 정렬: 크루장 > 페이서 > 그로워 > 멤버
    const roleOrder: Record<string, number> = { '크루장': 0, '페이서': 1, '그로워': 2, '멤버': 3 }
    const sorted = members.sort((a, b) => {
      const orderA = roleOrder[a.role] ?? 99
      const orderB = roleOrder[b.role] ?? 99
      if (orderA !== orderB) return orderA - orderB
      return a.order - b.order
    })

    return NextResponse.json(sorted)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}

// POST: 멤버 가입 신청 (활성=false로 저장)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, phone, kakaoId } = body

    if (!name || (!phone && !kakaoId)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await notion.pages.create({
      parent: { database_id: MEMBERS_DB_ID },
      properties: {
        '이름': {
          title: [{ text: { content: name } }]
        },
        '역할': {
          select: { name: '멤버' }
        },
        '전화번호': {
          number: phone ? parseInt(phone, 10) : null
        },
        '카카오ID': {
          rich_text: [{ text: { content: kakaoId || '' } }]
        },
        '활성': {
          checkbox: false  // 가입 대기 상태
        },
        '순서': {
          number: 999
        }
      },
    })

    console.log('Notion create result:', result.id)
    return NextResponse.json({ success: true, pageId: result.id })
  } catch (error: any) {
    console.error('Member application error:', JSON.stringify(error, null, 2))
    return NextResponse.json({ error: 'Failed to create member application', details: error?.message }, { status: 500 })
  }
}

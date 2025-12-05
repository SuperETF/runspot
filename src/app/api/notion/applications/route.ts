import { Client } from '@notionhq/client'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})

const APPLICATIONS_DB_ID = process.env.NOTION_APPLICATIONS_DB_ID || ''

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

function getRelationProperty(properties: any, key: string): string | null {
  const prop = properties[key]
  if (!prop || prop.type !== 'relation' || !prop.relation?.[0]) return null
  return prop.relation[0].id
}

// GET: 신청자 수 조회
export async function GET() {
  try {
    const response = await notion.databases.query({
      database_id: APPLICATIONS_DB_ID,
    })

    const counts: Record<string, number> = {}
    
    for (const page of response.results as any[]) {
      // 일정 제목으로 카운트 (텍스트 타입)
      const scheduleTitle = getTextProperty(page.properties, '일정')
      if (scheduleTitle) {
        counts[scheduleTitle] = (counts[scheduleTitle] || 0) + 1
      }
    }
    
    return NextResponse.json(counts)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }
}

// POST: 신청자 등록
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, phone, kakaoId, scheduleId } = body

    // 이름과 일정은 필수, 전화번호 또는 카카오ID 중 하나는 있어야 함
    if (!name || !scheduleId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await notion.pages.create({
      parent: { database_id: APPLICATIONS_DB_ID },
      properties: {
        '이름': {
          title: [{ text: { content: name } }]
        },
        '전화번호': {
          rich_text: [{ text: { content: phone || '' } }]
        },
        '카카오ID': {
          rich_text: [{ text: { content: kakaoId || '' } }]
        },
        '일정': {
          rich_text: [{ text: { content: scheduleId } }]
        },
        '신청일시': {
          date: { start: new Date().toISOString() }
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Application error:', error?.message || error)
    return NextResponse.json({ error: 'Failed to create application', details: error?.message }, { status: 500 })
  }
}

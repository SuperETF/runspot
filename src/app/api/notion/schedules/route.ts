import { Client } from '@notionhq/client'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})

const SCHEDULES_DB_ID = process.env.NOTION_SCHEDULES_DB_ID || ''

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

function getDateProperty(properties: any, key: string): string | null {
  const prop = properties[key]
  if (!prop || prop.type !== 'date' || !prop.date) return null
  return prop.date.start
}

function getSelectProperty(properties: any, key: string): string {
  const prop = properties[key]
  if (!prop || prop.type !== 'select' || !prop.select) return ''
  return prop.select.name || ''
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const upcoming = searchParams.get('upcoming') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    let filter: any = undefined
    
    if (upcoming) {
      const today = new Date().toISOString().split('T')[0]
      filter = {
        and: [
          { property: '런닝 완료됨', checkbox: { equals: false } },
          { property: '일정 날짜', date: { on_or_after: today } }
        ]
      }
    }

    const response = await notion.databases.query({
      database_id: SCHEDULES_DB_ID,
      filter,
      page_size: limit,
    })

    const schedules = response.results.map((page: any) => {
      const props = page.properties
      const scheduleType = getSelectProperty(props, '유형')
      return {
        id: page.id,
        title: getTextProperty(props, '런닝 제목'),
        description: getTextProperty(props, '런닝 설명') || null,
        schedule_date: getDateProperty(props, '일정 날짜'),
        time: getTextProperty(props, '시간'),
        location: getTextProperty(props, '집합장소'),
        distance: null,
        pace: getTextProperty(props, '런닝 페이스') || null,
        max_participants: getNumberProperty(props, '최대인원'),
        is_regular: scheduleType === '정기',
        is_completed: getCheckboxProperty(props, '런닝 완료됨'),
      }
    })

    return NextResponse.json(schedules)
  } catch (error: any) {
    console.error('Notion schedules error:', error?.message || error)
    return NextResponse.json({ error: 'Failed to fetch schedules', details: error?.message }, { status: 500 })
  }
}

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

interface UseVirtualListOptions {
  itemHeight: number
  containerHeight: number
  overscan?: number // 화면 밖에서 렌더링할 추가 아이템 수
  getItemKey?: (index: number) => string | number
}

interface VirtualItem {
  index: number
  start: number
  end: number
  key: string | number
}

export const useVirtualList = <T>(
  items: T[],
  options: UseVirtualListOptions
) => {
  const { itemHeight, containerHeight, overscan = 5, getItemKey } = options
  
  const [scrollTop, setScrollTop] = useState(0)
  const scrollElementRef = useRef<HTMLElement | null>(null)

  // 보이는 아이템 범위 계산
  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight)
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    )

    return {
      start: Math.max(0, visibleStart - overscan),
      end: Math.min(items.length - 1, visibleEnd + overscan)
    }
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length])

  // 가상 아이템 목록 생성
  const virtualItems = useMemo((): VirtualItem[] => {
    const result: VirtualItem[] = []
    
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      result.push({
        index: i,
        start: i * itemHeight,
        end: (i + 1) * itemHeight,
        key: getItemKey ? getItemKey(i) : i
      })
    }
    
    return result
  }, [visibleRange, itemHeight, getItemKey])

  // 전체 높이 계산
  const totalHeight = useMemo(() => {
    return items.length * itemHeight
  }, [items.length, itemHeight])

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLElement
    setScrollTop(target.scrollTop)
  }, [])

  // 스크롤 요소 설정
  const setScrollElement = useCallback((element: HTMLElement | null) => {
    if (scrollElementRef.current) {
      scrollElementRef.current.removeEventListener('scroll', handleScroll)
    }

    scrollElementRef.current = element

    if (element) {
      element.addEventListener('scroll', handleScroll, { passive: true })
      setScrollTop(element.scrollTop)
    }
  }, [handleScroll])

  // 특정 인덱스로 스크롤
  const scrollToIndex = useCallback((index: number, align: 'start' | 'center' | 'end' = 'start') => {
    if (!scrollElementRef.current) return

    const targetScrollTop = (() => {
      switch (align) {
        case 'start':
          return index * itemHeight
        case 'center':
          return index * itemHeight - containerHeight / 2 + itemHeight / 2
        case 'end':
          return index * itemHeight - containerHeight + itemHeight
        default:
          return index * itemHeight
      }
    })()

    scrollElementRef.current.scrollTo({
      top: Math.max(0, Math.min(targetScrollTop, totalHeight - containerHeight)),
      behavior: 'smooth'
    })
  }, [itemHeight, containerHeight, totalHeight])

  // 정리
  useEffect(() => {
    return () => {
      if (scrollElementRef.current) {
        scrollElementRef.current.removeEventListener('scroll', handleScroll)
      }
    }
  }, [handleScroll])

  return {
    virtualItems,
    totalHeight,
    visibleRange,
    setScrollElement,
    scrollToIndex,
    scrollTop
  }
}

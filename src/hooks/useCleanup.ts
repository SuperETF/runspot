import { useEffect, useRef, useCallback } from 'react'

interface CleanupFunction {
  (): void
}

interface UseCleanupReturn {
  addCleanup: (cleanup: CleanupFunction) => void
  removeCleanup: (cleanup: CleanupFunction) => void
  cleanup: () => void
}

/**
 * 컴포넌트 언마운트 시 자동으로 정리되는 리소스들을 관리하는 훅
 */
export const useCleanup = (): UseCleanupReturn => {
  const cleanupFunctionsRef = useRef<Set<CleanupFunction>>(new Set())

  const addCleanup = useCallback((cleanup: CleanupFunction) => {
    cleanupFunctionsRef.current.add(cleanup)
  }, [])

  const removeCleanup = useCallback((cleanup: CleanupFunction) => {
    cleanupFunctionsRef.current.delete(cleanup)
  }, [])

  const cleanup = useCallback(() => {
    cleanupFunctionsRef.current.forEach(fn => {
      try {
        fn()
      } catch (error) {
        console.error('정리 함수 실행 중 오류:', error)
      }
    })
    cleanupFunctionsRef.current.clear()
  }, [])

  // 컴포넌트 언마운트 시 자동 정리
  useEffect(() => {
    return cleanup
  }, [cleanup])

  return {
    addCleanup,
    removeCleanup,
    cleanup
  }
}

/**
 * 타이머 관리를 위한 훅
 */
export const useTimer = () => {
  const timersRef = useRef<Set<NodeJS.Timeout>>(new Set())
  const intervalsRef = useRef<Set<NodeJS.Timeout>>(new Set())
  const { addCleanup } = useCleanup()

  const setTimeout = useCallback((callback: () => void, delay: number) => {
    const timer = globalThis.setTimeout(() => {
      timersRef.current.delete(timer)
      callback()
    }, delay)
    
    timersRef.current.add(timer)
    return timer
  }, [])

  const setInterval = useCallback((callback: () => void, delay: number) => {
    const interval = globalThis.setInterval(callback, delay)
    intervalsRef.current.add(interval)
    return interval
  }, [])

  const clearTimeout = useCallback((timer: NodeJS.Timeout) => {
    globalThis.clearTimeout(timer)
    timersRef.current.delete(timer)
  }, [])

  const clearInterval = useCallback((interval: NodeJS.Timeout) => {
    globalThis.clearInterval(interval)
    intervalsRef.current.delete(interval)
  }, [])

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(timer => {
      globalThis.clearTimeout(timer)
    })
    timersRef.current.clear()

    intervalsRef.current.forEach(interval => {
      globalThis.clearInterval(interval)
    })
    intervalsRef.current.clear()
  }, [])

  // 컴포넌트 언마운트 시 모든 타이머 정리
  addCleanup(clearAllTimers)

  return {
    setTimeout,
    setInterval,
    clearTimeout,
    clearInterval,
    clearAllTimers
  }
}

/**
 * 이벤트 리스너 관리를 위한 훅
 */
export const useEventListener = () => {
  const listenersRef = useRef<Array<{
    element: EventTarget
    event: string
    handler: EventListener
    options?: boolean | AddEventListenerOptions
  }>>([])
  const { addCleanup } = useCleanup()

  const addEventListener = useCallback((
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ) => {
    element.addEventListener(event, handler, options)
    
    listenersRef.current.push({
      element,
      event,
      handler,
      options
    })
  }, [])

  const removeEventListener = useCallback((
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ) => {
    element.removeEventListener(event, handler, options)
    
    const index = listenersRef.current.findIndex(listener =>
      listener.element === element &&
      listener.event === event &&
      listener.handler === handler
    )
    
    if (index > -1) {
      listenersRef.current.splice(index, 1)
    }
  }, [])

  const removeAllEventListeners = useCallback(() => {
    listenersRef.current.forEach(({ element, event, handler, options }) => {
      try {
        element.removeEventListener(event, handler, options)
      } catch (error) {
        console.error('이벤트 리스너 제거 중 오류:', error)
      }
    })
    listenersRef.current = []
  }, [])

  // 컴포넌트 언마운트 시 모든 이벤트 리스너 정리
  addCleanup(removeAllEventListeners)

  return {
    addEventListener,
    removeEventListener,
    removeAllEventListeners
  }
}

/**
 * Geolocation API 관리를 위한 훅
 */
export const useGeolocation = () => {
  const watchIdsRef = useRef<Set<number>>(new Set())
  const { addCleanup } = useCleanup()

  const watchPosition = useCallback((
    success: PositionCallback,
    error?: PositionErrorCallback,
    options?: PositionOptions
  ) => {
    if (!navigator.geolocation) {
      throw new Error('Geolocation이 지원되지 않습니다.')
    }

    const watchId = navigator.geolocation.watchPosition(success, error, options)
    watchIdsRef.current.add(watchId)
    
    return watchId
  }, [])

  const clearWatch = useCallback((watchId: number) => {
    if (navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId)
      watchIdsRef.current.delete(watchId)
    }
  }, [])

  const clearAllWatches = useCallback(() => {
    if (navigator.geolocation) {
      watchIdsRef.current.forEach(watchId => {
        navigator.geolocation.clearWatch(watchId)
      })
      watchIdsRef.current.clear()
    }
  }, [])

  // 컴포넌트 언마운트 시 모든 위치 추적 정리
  addCleanup(clearAllWatches)

  return {
    watchPosition,
    clearWatch,
    clearAllWatches
  }
}

/**
 * 음성 합성 관리를 위한 훅
 */
export const useSpeechSynthesis = () => {
  const { addCleanup } = useCleanup()

  const speak = useCallback((text: string, options?: SpeechSynthesisUtterance) => {
    if (!('speechSynthesis' in window)) {
      console.warn('음성 합성이 지원되지 않습니다.')
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    
    if (options) {
      Object.assign(utterance, options)
    }

    speechSynthesis.speak(utterance)
    return utterance
  }, [])

  const cancel = useCallback(() => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
    }
  }, [])

  // 컴포넌트 언마운트 시 음성 합성 정리
  addCleanup(cancel)

  return {
    speak,
    cancel
  }
}

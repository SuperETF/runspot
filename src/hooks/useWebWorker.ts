import { useRef, useCallback, useEffect } from 'react'

interface WorkerTask {
  id: string
  type: string
  data: any
  resolve: (result: any) => void
  reject: (error: Error) => void
}

interface UseWebWorkerOptions {
  workerPath: string
  maxConcurrentTasks?: number
  timeout?: number
}

export const useWebWorker = (options: UseWebWorkerOptions) => {
  const { workerPath, maxConcurrentTasks = 5, timeout = 10000 } = options
  
  const workerRef = useRef<Worker | null>(null)
  const tasksRef = useRef<Map<string, WorkerTask>>(new Map())
  const taskQueueRef = useRef<WorkerTask[]>([])
  const runningTasksRef = useRef<Set<string>>(new Set())
  
  // 워커 초기화
  const initializeWorker = useCallback(() => {
    if (workerRef.current) return
    
    try {
      workerRef.current = new Worker(workerPath)
      
      workerRef.current.onmessage = (e) => {
        const { id, type, result, error } = e.data
        
        if (type === 'READY') {
          console.log('🔧 Web Worker 준비 완료:', workerPath)
          return
        }
        
        if (!id) return
        
        const task = tasksRef.current.get(id)
        if (!task) return
        
        // 실행 중 작업에서 제거
        runningTasksRef.current.delete(id)
        tasksRef.current.delete(id)
        
        if (type === 'SUCCESS') {
          task.resolve(result)
        } else if (type === 'ERROR') {
          task.reject(new Error(error))
        }
        
        // 대기 중인 작업 처리
        processQueue()
      }
      
      workerRef.current.onerror = (error) => {
        console.error('Web Worker 오류:', error)
        // 모든 대기 중인 작업 실패 처리
        tasksRef.current.forEach(task => {
          task.reject(new Error('Worker error'))
        })
        tasksRef.current.clear()
        runningTasksRef.current.clear()
      }
      
    } catch (error) {
      console.error('Web Worker 초기화 실패:', error)
    }
  }, [workerPath])
  
  // 작업 큐 처리
  const processQueue = useCallback(() => {
    if (!workerRef.current) return
    
    while (
      taskQueueRef.current.length > 0 && 
      runningTasksRef.current.size < maxConcurrentTasks
    ) {
      const task = taskQueueRef.current.shift()
      if (!task) break
      
      runningTasksRef.current.add(task.id)
      workerRef.current.postMessage({
        id: task.id,
        type: task.type,
        data: task.data
      })
      
      // 타임아웃 설정
      setTimeout(() => {
        if (tasksRef.current.has(task.id)) {
          runningTasksRef.current.delete(task.id)
          tasksRef.current.delete(task.id)
          task.reject(new Error('Task timeout'))
          processQueue()
        }
      }, timeout)
    }
  }, [maxConcurrentTasks, timeout])
  
  // 작업 실행
  const executeTask = useCallback(<T>(type: string, data: any): Promise<T> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        initializeWorker()
        // 워커 초기화 후 재시도
        setTimeout(() => {
          executeTask(type, data).then(resolve).catch(reject)
        }, 100)
        return
      }
      
      const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const task: WorkerTask = { id, type, data, resolve, reject }
      
      tasksRef.current.set(id, task)
      taskQueueRef.current.push(task)
      
      processQueue()
    })
  }, [initializeWorker, processQueue])
  
  // 워커 정리
  const cleanup = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
    
    // 모든 대기 중인 작업 취소
    tasksRef.current.forEach(task => {
      task.reject(new Error('Worker terminated'))
    })
    
    tasksRef.current.clear()
    taskQueueRef.current = []
    runningTasksRef.current.clear()
  }, [])
  
  // 컴포넌트 마운트 시 워커 초기화
  useEffect(() => {
    initializeWorker()
    return cleanup
  }, [initializeWorker, cleanup])
  
  return {
    executeTask,
    cleanup,
    isReady: () => workerRef.current !== null,
    getQueueSize: () => taskQueueRef.current.length,
    getRunningTasksCount: () => runningTasksRef.current.size
  }
}

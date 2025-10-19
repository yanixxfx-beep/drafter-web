import { useRef, useCallback } from 'react'

/**
 * Canvas Registry Hook
 * Stores canvas elements in a ref-based registry to avoid keeping them in React state
 * This prevents issues with React not detecting canvas pixel changes
 */
export function useCanvasRegistry() {
  const registryRef = useRef<Map<string, HTMLCanvasElement>>(new Map())

  const get = useCallback((id: string): HTMLCanvasElement | null => {
    return registryRef.current.get(id) ?? null
  }, [])

  const set = useCallback((id: string, canvas: HTMLCanvasElement | null) => {
    if (!canvas) {
      registryRef.current.delete(id)
    } else {
      registryRef.current.set(id, canvas)
    }
  }, [])

  const ensure = useCallback((id: string): HTMLCanvasElement => {
    let canvas = registryRef.current.get(id)
    if (!canvas) {
      canvas = document.createElement('canvas')
      registryRef.current.set(id, canvas)
    }
    return canvas
  }, [])

  const clear = useCallback(() => {
    registryRef.current.clear()
  }, [])

  return { get, set, ensure, clear }
}





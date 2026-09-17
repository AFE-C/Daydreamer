import { useEffect, useRef, useState } from 'react'

export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  // CSS keeps content visible by default. This flag only controls whether the
  // optional entrance animation has been confirmed by the observer.
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (!('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setIsVisible(true)
      observer.unobserve(element)
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return { ref, isVisible }
}

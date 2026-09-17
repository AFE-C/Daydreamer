import { useEffect, useRef } from 'react'

export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const glow = glowRef.current
    if (!glow) return
    const element = glow

    const finePointer = window.matchMedia('(pointer: fine)')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let enabled = finePointer.matches && !reducedMotion.matches
    let visible = false
    let animationFrame = 0
    let targetX = -100
    let targetY = -100
    let currentX = targetX
    let currentY = targetY

    function stop() {
      visible = false
      element.classList.remove('is-visible', 'is-target')
      if (animationFrame) cancelAnimationFrame(animationFrame)
      animationFrame = 0
    }

    function render() {
      animationFrame = 0
      currentX += (targetX - currentX) * 0.18
      currentY += (targetY - currentY) * 0.18
      element.style.setProperty('--cursor-x', `${currentX}px`)
      element.style.setProperty('--cursor-y', `${currentY}px`)

      if (!visible) return
      if (Math.abs(targetX - currentX) > 0.2 || Math.abs(targetY - currentY) > 0.2) {
        animationFrame = requestAnimationFrame(render)
      }
    }

    function syncAvailability() {
      enabled = finePointer.matches && !reducedMotion.matches
      if (!enabled) stop()
    }

    function handlePointerMove(event: PointerEvent) {
      if (!enabled || event.pointerType === 'touch') return
      targetX = event.clientX
      targetY = event.clientY
      visible = true
      element.classList.add('is-visible')
      const target = event.target instanceof Element
        ? event.target.closest('button, a, input, textarea, [contenteditable="true"]')
        : null
      element.classList.toggle('is-target', Boolean(target))
      if (!animationFrame) animationFrame = requestAnimationFrame(render)
    }

    function handlePointerLeave(event: PointerEvent) {
      if (!event.relatedTarget) stop()
    }

    function handleVisibilityChange() {
      if (document.hidden) stop()
    }

    document.documentElement.addEventListener('pointermove', handlePointerMove, { passive: true, capture: true })
    document.documentElement.addEventListener('pointerleave', handlePointerLeave, { passive: true })
    document.addEventListener('visibilitychange', handleVisibilityChange)
    finePointer.addEventListener?.('change', syncAvailability)
    reducedMotion.addEventListener?.('change', syncAvailability)

    return () => {
      stop()
      document.documentElement.removeEventListener('pointermove', handlePointerMove, true)
      document.documentElement.removeEventListener('pointerleave', handlePointerLeave)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      finePointer.removeEventListener?.('change', syncAvailability)
      reducedMotion.removeEventListener?.('change', syncAvailability)
    }
  }, [])

  return <div ref={glowRef} className="cursor-glow" aria-hidden="true" />
}

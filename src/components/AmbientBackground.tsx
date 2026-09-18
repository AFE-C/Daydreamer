import { useEffect, useRef } from 'react'

export function AmbientBackground() {
  const fieldRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const field = fieldRef.current
    if (!field || !window.matchMedia('(pointer: fine)').matches) return

    let frame = 0
    let currentX = 0
    let currentY = 0
    let targetX = 0
    let targetY = 0

    const render = () => {
      frame = 0
      currentX += (targetX - currentX) * 0.08
      currentY += (targetY - currentY) * 0.08
      field.style.setProperty('--ambient-parallax-x', `${currentX.toFixed(2)}px`)
      field.style.setProperty('--ambient-parallax-y', `${currentY.toFixed(2)}px`)

      if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
        frame = window.requestAnimationFrame(render)
      }
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== 'mouse') return
      targetX = ((event.clientX / window.innerWidth) - 0.5) * 12
      targetY = ((event.clientY / window.innerHeight) - 0.5) * 9
      if (!frame) frame = window.requestAnimationFrame(render)
    }

    const resetPointer = () => {
      targetX = 0
      targetY = 0
      if (!frame) frame = window.requestAnimationFrame(render)
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('blur', resetPointer)
    document.addEventListener('visibilitychange', resetPointer)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('blur', resetPointer)
      document.removeEventListener('visibilitychange', resetPointer)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div ref={fieldRef} className="ambient-background" aria-hidden="true">
      <span className="ambient-orb ambient-orb-cyan" />
      <span className="ambient-orb ambient-orb-lavender" />
      <span className="ambient-orb ambient-orb-mint" />
      <span className="ambient-sheen" />
    </div>
  )
}

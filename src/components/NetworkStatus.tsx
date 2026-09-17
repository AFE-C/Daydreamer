import { useEffect, useRef, useState } from 'react'
import { useOnlineStatus } from '../hooks/usePwa'

export function NetworkStatus() {
  const isOnline = useOnlineStatus()
  const wasOnline = useRef(isOnline)
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    if (!wasOnline.current && isOnline) {
      setShowReconnected(true)
    }

    wasOnline.current = isOnline

    if (!isOnline) {
      setShowReconnected(false)
    }
  }, [isOnline])

  useEffect(() => {
    if (!showReconnected) return

    const timeoutId = window.setTimeout(() => setShowReconnected(false), 3200)
    return () => window.clearTimeout(timeoutId)
  }, [showReconnected])

  if (!isOnline) {
    return (
      <div className="network-status offline" role="status" aria-live="polite">
        <span className="network-status-dot" aria-hidden="true" />
        离线 · 记录会保存到本机
      </div>
    )
  }

  if (!showReconnected) return null

  return (
    <div className="network-status reconnected" role="status" aria-live="polite">
      <span className="network-status-dot" aria-hidden="true" />
      连接已恢复
    </div>
  )
}

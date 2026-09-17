import { useEffect, useState } from 'react'
import { SYNC_STATUS_EVENT } from '../app/events'
import { db, type SyncMeta } from '../db/daydreamerDb'
import { useAuth } from '../features/auth/AuthContext'

const labels: Record<SyncMeta['state'], string> = {
  idle: '准备同步',
  syncing: '正在同步',
  synced: '已同步',
  offline: '离线待同步',
  error: '本地已保存',
}

export function SyncStatus() {
  const { user } = useAuth()
  const [meta, setMeta] = useState<SyncMeta>({ ownerId: '', state: 'idle' })

  useEffect(() => {
    if (!user) return
    let active = true
    const load = async () => {
      try {
        const next = await db.syncMeta.get(user.id)
        if (active && next) setMeta(next)
      } catch {
        // The editor remains usable even if the status cache is unavailable.
      }
    }
    void load()
    const handler = () => void load()
    window.addEventListener(SYNC_STATUS_EVENT, handler)
    const interval = window.setInterval(() => void load(), 5000)
    return () => {
      active = false
      window.removeEventListener(SYNC_STATUS_EVENT, handler)
      window.clearInterval(interval)
    }
  }, [user?.id])

  if (!user) return null
  return <span className={`sync-status sync-${meta.state}`} role="status" aria-live="polite"><i aria-hidden="true" />{labels[meta.state]}</span>
}

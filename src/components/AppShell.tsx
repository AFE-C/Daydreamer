import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CursorGlow } from './CursorGlow'
import { NetworkStatus } from './NetworkStatus'
import { PwaUpdatePrompt } from './PwaUpdatePrompt'
import { SettingsIcon, SparklesIcon } from './icons'
import { useAuth } from '../features/auth/AuthContext'
import { SyncStatus } from './SyncStatus'

type AppShellProps = {
  children: ReactNode
  onOpenData: () => void
}

export function AppShell({ children, onOpenData }: AppShellProps) {
  const { user, signOut, syncNow } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  async function handleSignOut() {
    try {
      await signOut()
    } catch {
      // The auth layer keeps the current local cache safe even if sign-out needs retrying.
    }
  }

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return
    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) setMenuOpen(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  useEffect(() => {
    const animationFrames = new Set<number>()
    const timers = new Set<number>()

    function handleTouchStart(event: PointerEvent) {
      if (event.pointerType !== 'touch') return
      const source = event.target instanceof Element ? event.target : null
      const target = source?.closest<HTMLElement>('button:not(:disabled), a.button, a.nav-link')
      if (!target) return

      const bounds = target.getBoundingClientRect()
      target.style.setProperty('--ripple-x', `${event.clientX - bounds.left}px`)
      target.style.setProperty('--ripple-y', `${event.clientY - bounds.top}px`)
      target.classList.add('motion-ripple-host')
      target.classList.remove('is-rippling')

      const frame = window.requestAnimationFrame(() => {
        animationFrames.delete(frame)
        if (!target.isConnected) return
        target.classList.add('is-rippling')
        const timer = window.setTimeout(() => {
          timers.delete(timer)
          target.classList.remove('is-rippling')
        }, 380)
        timers.add(timer)
      })
      animationFrames.add(frame)
    }

    document.addEventListener('pointerdown', handleTouchStart, { capture: true, passive: true })
    return () => {
      document.removeEventListener('pointerdown', handleTouchStart, true)
      animationFrames.forEach((frame) => window.cancelAnimationFrame(frame))
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <CursorGlow />
      <NetworkStatus />
      <PwaUpdatePrompt />
      <header className="topbar page-width">
        <div className="brand-menu-wrap" ref={menuRef}>
          <button type="button" className="brand" aria-label="打开 Daydreamer 菜单" aria-expanded={menuOpen} aria-controls="brand-menu" onClick={() => setMenuOpen((open) => !open)}>
            <span className="brand-mark" aria-hidden="true"><span className="brand-orbit" /><span className="brand-orb" /><span className="brand-glint" /></span>
            <span className="brand-copy">
              <strong>Daydreamer</strong>
              <span>记录当下的微光</span>
            </span>
          </button>
          {menuOpen && <div id="brand-menu" className="brand-menu" role="menu">
            <button type="button" className="brand-menu-item" role="menuitem" onClick={() => { setMenuOpen(false); navigate('/') }}>时间线</button>
            <button type="button" className="brand-menu-item" role="menuitem" onClick={() => { setMenuOpen(false); navigate('/review') }}>回顾</button>
            <button type="button" className="brand-menu-item" role="menuitem" onClick={() => { setMenuOpen(false); onOpenData() }}><SettingsIcon size={15} />备份与恢复</button>
            <div className="brand-menu-divider" />
            <button type="button" className="brand-menu-item" role="menuitem" onClick={() => void syncNow()}><span className="sync-menu-dot" />立即同步</button>
            <button type="button" className="brand-menu-item brand-menu-signout" role="menuitem" onClick={() => void handleSignOut()}>退出登录<span className="menu-account">{user?.email}</span></button>
          </div>}
        </div>
        <SyncStatus />
      </header>
      <main className="page-width app-main">
        <div className="route-stage" key={location.pathname}>{children}</div>
      </main>
      <div className="shell-signature" aria-hidden="true"><SparklesIcon size={14} /> 把想法留在这里</div>
    </div>
  )
}

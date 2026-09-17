import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { NetworkStatus } from './NetworkStatus'
import { PwaUpdatePrompt } from './PwaUpdatePrompt'
import { SettingsIcon, SparklesIcon } from './icons'

type AppShellProps = {
  children: ReactNode
  onOpenData: () => void
}

export function AppShell({ children, onOpenData }: AppShellProps) {
  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <NetworkStatus />
      <PwaUpdatePrompt />
      <header className="topbar page-width">
        <NavLink to="/" className="brand" aria-label="回到 Daydreamer 首页">
          <span className="brand-mark" aria-hidden="true"><span className="brand-glass" /><span className="brand-glint" /></span>
          <span className="brand-copy">
            <strong>Daydreamer</strong>
            <span>记录当下的微光</span>
          </span>
        </NavLink>
        <nav className="main-nav" aria-label="主导航">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>时间线</NavLink>
          <NavLink to="/review" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>回顾</NavLink>
          <button type="button" className="nav-link nav-button" onClick={onOpenData}>
            <SettingsIcon size={16} /> 备份与恢复
          </button>
        </nav>
      </header>
      <main className="page-width app-main">{children}</main>
      <div className="shell-signature" aria-hidden="true"><SparklesIcon size={14} /> 把想法留在这里</div>
    </div>
  )
}

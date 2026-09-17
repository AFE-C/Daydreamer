import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { DataModal } from './components/DataModal'
import { EntryEditorPage } from './features/entries/EntryEditorPage'
import { ReviewPage } from './features/entries/ReviewPage'
import { TimelinePage } from './features/entries/TimelinePage'
import { PwaInstallProvider } from './hooks/usePwa'
import { AuthPage } from './features/auth/AuthPage'
import { AuthProvider, useAuth } from './features/auth/AuthContext'

function AuthenticatedRoutes() {
  const { loading, session } = useAuth()
  const [dataOpen, setDataOpen] = useState(false)

  if (loading) return <div className="loading-state app-loading">正在准备你的私人空间…</div>
  if (!session) return <AuthPage />

  return (
    <AppShell onOpenData={() => setDataOpen(true)}>
      <Routes>
        <Route path="/" element={<TimelinePage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/entry/new" element={<EntryEditorPage />} />
        <Route path="/entry/:id" element={<EntryEditorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {dataOpen && <DataModal onClose={() => setDataOpen(false)} />}
    </AppShell>
  )
}

export default function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

  return (
    <AuthProvider>
      <PwaInstallProvider>
        <BrowserRouter basename={basename} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthenticatedRoutes />
        </BrowserRouter>
      </PwaInstallProvider>
    </AuthProvider>
  )
}

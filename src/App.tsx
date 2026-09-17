import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { DataModal } from './components/DataModal'
import { EntryEditorPage } from './features/entries/EntryEditorPage'
import { ReviewPage } from './features/entries/ReviewPage'
import { TimelinePage } from './features/entries/TimelinePage'
import { PwaInstallProvider } from './hooks/usePwa'

export default function App() {
  const [dataOpen, setDataOpen] = useState(false)
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

  return (
    <PwaInstallProvider>
      <BrowserRouter basename={basename} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppShell onOpenData={() => setDataOpen(true)}>
          <Routes>
            <Route path="/" element={<TimelinePage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/entry/new" element={<EntryEditorPage />} />
            <Route path="/entry/:id" element={<EntryEditorPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
        {dataOpen && <DataModal onClose={() => setDataOpen(false)} />}
      </BrowserRouter>
    </PwaInstallProvider>
  )
}

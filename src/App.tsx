import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { DataModal } from './components/DataModal'
import { EntryEditorPage } from './features/entries/EntryEditorPage'
import { TimelinePage } from './features/entries/TimelinePage'

export default function App() {
  const [dataOpen, setDataOpen] = useState(false)

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppShell onOpenData={() => setDataOpen(true)}>
        <Routes>
          <Route path="/" element={<TimelinePage />} />
          <Route path="/entry/new" element={<EntryEditorPage />} />
          <Route path="/entry/:id" element={<EntryEditorPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
      {dataOpen && <DataModal onClose={() => setDataOpen(false)} />}
    </BrowserRouter>
  )
}

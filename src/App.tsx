import { useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { Shell } from './components/Shell'
import { Toasts } from './components/Toasts'
import { Admin } from './features/admin/Admin'
import { Board } from './features/board/Board'
import { Dashboard } from './features/dashboard/Dashboard'
import { Reports } from './features/dashboard/Reports'
import { DocumentsPage } from './features/documents/DocumentsPage'
import { ProjectDetail } from './features/projects/ProjectDetail'
import { ProjectForm } from './features/projects/ProjectForm'
import { ProjectsView } from './features/projects/ProjectsView'
import { useStore } from './store/store'

export default function App() {
  const theme = useStore((s) => s.theme)

  // Keep the <html> theme class in sync with persisted state.
  useEffect(() => {
    const el = document.documentElement
    el.classList.remove('light', 'dark')
    el.classList.add(theme)
  }, [theme])

  return (
    <HashRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/my" element={<ProjectsView scope="mine" />} />
          <Route path="/projects" element={<ProjectsView scope="all" />} />
          <Route path="/board" element={<Board />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </Shell>

      {/* Global overlays */}
      <ProjectDetail />
      <ProjectForm />
      <Toasts />
    </HashRouter>
  )
}

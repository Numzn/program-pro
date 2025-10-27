import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Import all page components using standard relative paths for Render build
import HomePage from './pages/public/HomePage'
import ProgramViewPage from './pages/public/ProgramViewPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminProgramsPage from './pages/admin/AdminProgramsPage'
import AdminProgramEditorPage from './pages/admin/AdminProgramEditorPage'
import AdminBulkImportPage from './pages/admin/AdminBulkImportPage'
import AdminChurchSettingsPage from './pages/admin/AdminChurchSettingsPage'

import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<Layout><HomePage /></Layout>} />
          <Route path="/program/:id" element={<Layout><ProgramViewPage /></Layout>} />
          <Route path="/qr/:id" element={<Layout><ProgramViewPage /></Layout>} />
          
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <Layout><AdminDashboardPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/programs" element={
            <ProtectedRoute>
              <Layout><AdminProgramsPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/programs/new" element={
            <ProtectedRoute>
              <Layout><AdminProgramEditorPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/programs/:id/edit" element={
            <ProtectedRoute>
              <Layout><AdminProgramEditorPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/programs/bulk-import" element={
            <ProtectedRoute>
              <Layout><AdminBulkImportPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute>
              <Layout><AdminChurchSettingsPage /></Layout>
            </ProtectedRoute>
          } />
        </Routes>
        
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
              border: '1px solid hsl(var(--border))',
            },
          }}
        />
      </div>
    </Router>
  )
}

export default App
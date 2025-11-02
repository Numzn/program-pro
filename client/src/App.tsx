import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Import all page components using standard relative paths for Render build
// Force redeployment with correct API URL configuration
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
import { useAuthStore } from './store/authStore'

function App() {
  const { validateAuth, isLoading } = useAuthStore()

  // Initialize auth on app mount
  useEffect(() => {
    const initAuth = async () => {
      // Validate existing token if present
      await validateAuth()
    }
    
    initAuth()
  }, [validateAuth])

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
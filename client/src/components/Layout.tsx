import React, { useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useChurchStore } from '../store/churchStore'
import PWAInstallPrompt from './PWAInstallPrompt'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')
  const { church, fetchChurchSettings } = useChurchStore()

  useEffect(() => {
    if (isAdminRoute) {
      fetchChurchSettings()
    }
  }, [isAdminRoute, fetchChurchSettings])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-brand-background flex flex-col">
      {/* Premium Header - Clean & Responsive */}
      <header className="sticky top-0 z-50 gradient-header shadow-brand-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              {/* Logo */}
              <div className="flex-shrink-0">
                <img 
                  src="/church-logo.png" 
                  alt="Church Logo" 
                  className="h-10 sm:h-12 w-auto object-contain"
                  loading="eager"
                  decoding="async"
                  width="48"
                  height="48"
                />
              </div>
              
              {/* Brand Text */}
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl lg:text-2xl font-black text-white tracking-tight truncate">
                  {church?.name || 'Numz'}
                </h1>
                <p className="hidden sm:block text-xs lg:text-sm text-white/70 font-medium truncate">
                  {isAdminRoute ? 'Admin Dashboard' : 'Program Management System'}
                </p>
              </div>
            </div>

            {/* Navigation - Desktop */}
            {isAdminRoute && (
              <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 flex-shrink-0 ml-4">
                <Link 
                  to="/admin" 
                  className={`px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                    location.pathname === '/admin' 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/admin/programs" 
                  className={`px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                    location.pathname.includes('/admin/programs') 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Programs
                </Link>
                <Link 
                  to="/admin/settings" 
                  className={`px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                    location.pathname === '/admin/settings' 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Settings
                </Link>
                <Link 
                  to="/" 
                  className="px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 whitespace-nowrap"
                >
                  View Site
                </Link>
              </nav>
            )}

            {/* Admin Login Button - Public Pages */}
            {!isAdminRoute && (
              <nav className="flex items-center flex-shrink-0 ml-4">
                <Link 
                  to="/admin/login" 
                  className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 whitespace-nowrap"
                >
                  Admin
                </Link>
              </nav>
            )}

            {/* Mobile Menu Button - Admin Routes */}
            {isAdminRoute && (
              <div className="md:hidden flex items-center ml-4">
                <Link 
                  to="/" 
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                  View
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content with Premium Spacing */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  )
}

export default Layout
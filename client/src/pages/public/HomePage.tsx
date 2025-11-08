import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProgramStore } from '../../store/programStore'
import { useChurchStore } from '../../store/churchStore'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { formatDate, isToday } from '../../utils/date'

const HomePage: React.FC = () => {
  const { programs, isLoading, error: programsError, fetchPrograms } = useProgramStore()
  const { church, isLoading: churchLoading, error: churchError, fetchChurchInfo } = useChurchStore()
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)

  useEffect(() => {
    // Fetch all active programs
    fetchPrograms(undefined, true).catch((err) => {
      console.error('Failed to fetch programs:', err)
    })
    // Fetch church info (public endpoint)
    fetchChurchInfo().catch((err) => {
      console.error('Failed to fetch church info:', err)
    })

    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallButton(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [fetchPrograms, fetchChurchInfo])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log('Install prompt outcome:', outcome)
      setDeferredPrompt(null)
      setShowInstallButton(false)
    } catch (error) {
      console.error('Error showing install prompt:', error)
    }
  }

  if (isLoading || churchLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Show error state if both failed
  if (programsError && churchError) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Unable to Load Content</h2>
        <p className="text-muted-foreground mb-6">
          {programsError || 'Failed to load programs. Please try again later.'}
        </p>
        <Button onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            {church?.name || 'Programs'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Browse the latest programs and events below.
          </p>
        </div>

        {showInstallButton && (
          <Button
            onClick={handleInstallClick}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            📱 Install App
          </Button>
        )}
      </div>

      {programs.length === 0 ? (
        <Card className="gradient-card">
          <CardContent className="text-center py-12">
          <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-muted rounded"></div>
          </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">No programs available</h3>
            <p className="text-muted-foreground mb-6">
              Check back later for upcoming programs.
            </p>
            <Button asChild variant="outline">
              <Link to="/admin/login">Admin Login</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-6 lg:gap-8">
            {programs.filter(program => program.is_active).map((program) => (
              <div 
                key={program.id} 
                className="group relative"
              >
                {/* Card Glow Effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-accent to-secondary rounded-2xl opacity-0 group-hover:opacity-20 blur transition-all duration-500"></div>
                
                <Card className="relative gradient-card border-2 border-transparent group-hover:border-primary/20 shadow-brand group-hover:shadow-brand-lg transition-all duration-300 bg-white/95 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      {/* Left Content */}
                      <div className="flex-1 space-y-3">
                        {/* Title with Icon */}
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-brand">
                            <div className="w-6 h-6 border-2 border-white rounded"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                              {program.title}
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary text-sm font-semibold rounded-lg">
                      {formatDate(program.date)}
                              </span>
                      {isToday(program.date) && (
                                <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-accent to-secondary text-white text-sm font-bold rounded-lg shadow-brand">
                          Today
                        </span>
                      )}
                            </div>
                          </div>
                        </div>

                        {/* Theme */}
                    {program.theme && (
                          <div className="flex items-start space-x-2 p-3 bg-gradient-to-r from-muted/30 to-transparent rounded-xl border-l-4 border-accent">
                            <div className="w-4 h-4 border-2 border-accent rounded-full flex-shrink-0 mt-0.5"></div>
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Theme</p>
                              <p className="text-sm font-medium text-foreground mt-0.5">{program.theme}</p>
                            </div>
                          </div>
                    )}
                  </div>
                </div>
              </CardHeader>

                  <CardContent className="pt-4">
                    {/* Action Button */}
                    <Button asChild className="w-full sm:w-auto shadow-brand hover:shadow-brand-lg group-hover:scale-105 transition-all duration-300">
                      <Link to={`/program/${program.id}`} className="inline-flex items-center justify-center">
                        <span>View Program Details</span>
                        <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                  </Button>
              </CardContent>
            </Card>
              </div>
          ))}
            </div>
          </div>
        </div>
      )}

      {/* Admin Access */}
      <div className="text-center mt-12">
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200 shadow-sm">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <p className="text-gray-600">
          Need to manage programs?{' '}
            <Link to="/admin/login" className="text-primary hover:text-accent font-semibold transition-colors">
            Admin Login
          </Link>
        </p>
        </div>
      </div>
    </div>
  )
}

export default HomePage
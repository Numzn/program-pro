import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useProgramStore } from '../../store/programStore'
import { useAuthStore } from '../../store/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { formatDate, isToday } from '../../utils/date'

const AdminDashboardPage: React.FC = () => {
  const { programs, isLoading, fetchPrograms } = useProgramStore()
  const { user, logout } = useAuthStore()

  useEffect(() => {
    if (user?.church_id) {
      fetchPrograms(user.church_id)
    }
  }, [user?.church_id, fetchPrograms])

  const handleLogout = async () => {
    await logout()
    window.location.href = '/admin/login'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const activePrograms = programs.filter(p => p.is_active)
  const todayPrograms = programs.filter(p => isToday(p.date))

  return (
    <div className="space-y-8">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden rounded-3xl shadow-brand-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-secondary opacity-95"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bS00IDR2Mmgydi0yaC0yem0tNCA0djJoMnYtMmgtMnptOC00djJoMnYtMmgtMnptLTQtNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        
        <div className="relative px-6 py-10 sm:px-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                <span className="text-white text-xs font-semibold">Admin Dashboard</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                Welcome Back!
              </h1>
              
              <div className="space-y-1">
                <p className="text-lg text-white/90">
                  Hello, <span className="font-bold text-white">{user?.username}</span>
                </p>
                <p className="text-sm text-white/70">
                  Manage your church programs and events with ease
          </p>
        </div>
            </div>

            <Button 
              variant="outline" 
              onClick={handleLogout} 
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm shadow-brand"
            >
          Logout
        </Button>
          </div>
        </div>
      </div>

      {/* Premium Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Programs Card */}
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-2xl opacity-0 group-hover:opacity-30 blur transition-all duration-500"></div>
          <Card className="relative gradient-card border-2 border-transparent group-hover:border-primary/30 shadow-brand group-hover:shadow-brand-lg transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Total Programs</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-brand group-hover:scale-110 transition-transform duration-300">
                <div className="w-6 h-6 border-2 border-white rounded"></div>
              </div>
          </CardHeader>
          <CardContent>
              <div className="text-4xl font-black text-primary mb-1 group-hover:scale-105 transition-transform">{programs.length}</div>
              <p className="text-sm text-muted-foreground font-medium">All time programs created</p>
              <div className="mt-3 pt-3 border-t border-border/50">
                <span className="text-xs text-primary font-semibold">View all →</span>
              </div>
          </CardContent>
        </Card>
        </div>

        {/* Active Programs Card */}
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl opacity-0 group-hover:opacity-30 blur transition-all duration-500"></div>
          <Card className="relative gradient-card border-2 border-transparent group-hover:border-green-400/30 shadow-brand group-hover:shadow-brand-lg transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/5 rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Active Programs</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-brand group-hover:scale-110 transition-transform duration-300">
                <div className="w-6 h-6 border-2 border-white rounded-full"></div>
              </div>
          </CardHeader>
          <CardContent>
              <div className="text-4xl font-black text-green-600 mb-1 group-hover:scale-105 transition-transform">{activePrograms.length}</div>
              <p className="text-sm text-muted-foreground font-medium">Currently visible to public</p>
              <div className="mt-3 pt-3 border-t border-border/50">
                <span className="text-xs text-green-600 font-semibold">Manage →</span>
              </div>
          </CardContent>
        </Card>
        </div>

        {/* Today's Programs Card */}
        <div className="group relative sm:col-span-2 lg:col-span-1">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-accent to-secondary rounded-2xl opacity-0 group-hover:opacity-30 blur transition-all duration-500"></div>
          <Card className="relative gradient-card border-2 border-transparent group-hover:border-accent/30 shadow-brand group-hover:shadow-brand-lg transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Today's Programs</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center shadow-brand group-hover:scale-110 transition-transform duration-300">
                <div className="w-6 h-6 border-2 border-white rounded-sm"></div>
              </div>
          </CardHeader>
          <CardContent>
              <div className="text-4xl font-black text-accent mb-1 group-hover:scale-105 transition-transform">{todayPrograms.length}</div>
              <p className="text-sm text-muted-foreground font-medium">Scheduled for today</p>
              <div className="mt-3 pt-3 border-t border-border/50">
                <span className="text-xs text-accent font-semibold">View schedule →</span>
              </div>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Recent Programs Section */}
      <Card className="gradient-card shadow-brand border-2 border-border/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">Recent Programs</CardTitle>
              <CardDescription className="text-sm mt-1">
                Your latest church programs at a glance
              </CardDescription>
            </div>
            <Button asChild className="shadow-brand hover:shadow-brand-lg w-full sm:w-auto">
              <Link to="/admin/programs" className="inline-flex items-center justify-center">
                <span>View All Programs</span>
                <span className="ml-2">→</span>
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {programs.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 border-2 border-primary rounded"></div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No programs yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Get started by creating your first church program
              </p>
              <Button asChild className="shadow-brand hover:shadow-brand-lg">
                <Link to="/admin/programs/new" className="inline-flex items-center">
                  Create Your First Program
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {programs.slice(0, 5).map((program, index) => (
                <div 
                  key={program.id} 
                  className="group relative overflow-hidden"
                >
                  {/* Hover Effect */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 rounded-xl opacity-0 group-hover:opacity-100 blur transition-all duration-300"></div>
                  
                  <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-2 border-border rounded-xl gradient-card group-hover:border-primary/30 transition-all duration-300">
                    {/* Left: Program Info */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Number Badge */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{index + 1}</span>
                      </div>
                      
                      {/* Program Details */}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
                          {program.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="inline-flex items-center text-xs text-muted-foreground">
                      {formatDate(program.date)}
                          </span>
                      {isToday(program.date) && (
                            <span className="inline-flex items-center px-2 py-0.5 bg-gradient-to-r from-accent to-secondary text-white text-xs font-bold rounded-md">
                          Today
                        </span>
                      )}
                          {program.theme && (
                            <span className="inline-flex items-center text-xs text-muted-foreground">
                              {program.theme}
                            </span>
                          )}
                        </div>
                      </div>
                  </div>
                    
                    {/* Right: Status & Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-3 py-1 text-xs font-bold rounded-lg ${
                      program.is_active 
                          ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-sm' 
                          : 'bg-gray-200 text-gray-700'
                    }`}>
                      {program.is_active ? 'Active' : 'Inactive'}
                    </span>
                      <Button variant="outline" size="sm" asChild className="hover:bg-primary hover:text-white transition-all">
                      <Link to={`/admin/programs/${program.id}/edit`}>
                        Edit
                      </Link>
                    </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {programs.length > 5 && (
                <div className="text-center pt-4">
                  <Button asChild variant="outline" className="shadow-brand hover:shadow-brand-lg">
                    <Link to="/admin/programs">
                      View All {programs.length} Programs →
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminDashboardPage
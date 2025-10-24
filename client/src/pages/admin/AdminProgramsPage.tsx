import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useProgramStore } from '../../store/programStore'
import { useAuthStore } from '../../store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { formatDate, isToday } from '../../utils/date'
import toast from 'react-hot-toast'

const AdminProgramsPage: React.FC = () => {
  const { programs, isLoading, fetchPrograms, deleteProgram } = useProgramStore()
  const { user } = useAuthStore()

  useEffect(() => {
    if (user?.church_id) {
      fetchPrograms(user.church_id)
    }
  }, [user?.church_id, fetchPrograms])

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this program?')) {
      try {
        await deleteProgram(id)
        toast.success('Program deleted successfully')
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete program')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl shadow-brand-lg p-8 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-foreground mb-2">Programs</h1>
            <p className="text-muted-foreground text-base">
              Manage and organize your church programs
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button asChild variant="outline" className="shadow-brand hover:shadow-brand-lg w-full sm:w-auto">
              <Link to="/admin/programs/bulk-import" className="inline-flex items-center justify-center">
                <span>Bulk Import</span>
              </Link>
            </Button>
            <Button asChild className="shadow-brand hover:shadow-brand-lg w-full sm:w-auto">
              <Link to="/admin/programs/new" className="inline-flex items-center justify-center">
                <span>Create New Program</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {programs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <h3 className="text-lg font-medium mb-2">No programs yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first program to get started.
            </p>
            <Button asChild>
              <Link to="/admin/programs/new">Create Program</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {programs.map((program) => (
            <div key={program.id} className="group relative">
              {/* Hover Glow */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-accent to-secondary rounded-2xl opacity-0 group-hover:opacity-20 blur transition-all duration-500"></div>
              
              <Card className="relative h-full gradient-card border-2 border-transparent group-hover:border-primary/20 shadow-brand group-hover:shadow-brand-lg transition-all duration-300 flex flex-col">
                <CardHeader className="pb-3">
                  {/* Icon and Status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-brand flex-shrink-0">
                      <span className="text-2xl">📅</span>
                    </div>
                    <span className={`px-3 py-1 text-xs font-bold rounded-xl shadow-sm ${
                      program.is_active 
                        ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' 
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {program.is_active ? '✓ Active' : '○ Inactive'}
                    </span>
                  </div>
                  
                  {/* Title */}
                  <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
                    {program.title}
                  </CardTitle>
                  
                  {/* Date */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-lg">
                      📍 {formatDate(program.date)}
                    </span>
                    {isToday(program.date) && (
                      <span className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-accent to-secondary text-white text-xs font-bold rounded-lg shadow-sm animate-pulse">
                        Today
                      </span>
                    )}
                  </div>
                  
                  {/* Theme */}
                  {program.theme && (
                    <p className="text-sm text-muted-foreground mt-3 p-2 bg-muted/30 rounded-lg border-l-2 border-accent line-clamp-2">
                      🎯 {program.theme}
                    </p>
                  )}
                </CardHeader>
                
                <CardContent className="pt-3 mt-auto border-t border-border/50">
                  <div className="flex flex-col gap-2">
                    <Button asChild variant="default" size="sm" className="w-full shadow-brand hover:shadow-brand-lg">
                      <Link to={`/admin/programs/${program.id}/edit`} className="inline-flex items-center justify-center">
                        <span>✏️ Edit</span>
                      </Link>
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button asChild variant="outline" size="sm" className="text-xs">
                        <Link to={`/program/${program.id}`} target="_blank">
                          👁️ View
                        </Link>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(program.id)}
                        className="text-xs"
                      >
                        🗑️ Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminProgramsPage
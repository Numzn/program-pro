import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProgramStore } from '../../store/programStore'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import ProgramDetailsForm from '../../components/ProgramDetailsForm'
import toast from 'react-hot-toast'

const AdminProgramEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  
  const { 
    activeProgram, 
    isLoading, 
    fetchProgramById, 
    createProgram,
    updateProgram
  } = useProgramStore()
  const { user } = useAuthStore()
  
  // Program form data
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    theme: '',
    is_active: true
  })

  // Reset form state when switching between create/edit modes or different programs
  useEffect(() => {
    if (!isEditing) {
      // Reset form when creating new program
      setFormData({ title: '', date: '', theme: '', is_active: true })
    }
  }, [isEditing])

  // Load program data when editing
  useEffect(() => {
    if (isEditing && id) {
      fetchProgramById(parseInt(id)).catch((error) => {
        console.error('Failed to fetch program:', error)
        toast.error('Failed to load program details')
      })
    }
  }, [isEditing, id])

  // Populate form when program loads
  useEffect(() => {
    if (isEditing && activeProgram && activeProgram.id === parseInt(id || '0')) {
      // Set form data with enhanced date parsing
      let dateStr = ''
      if (activeProgram.date) {
        try {
          const dateValue = activeProgram.date
          // activeProgram.date is typed as string, but handle all cases
          if (typeof dateValue === 'string') {
            // Handle ISO format (with T or Z)
            if (dateValue.includes('T') || dateValue.includes('Z')) {
              const date = new Date(dateValue)
              if (!isNaN(date.getTime())) {
                dateStr = date.toISOString().split('T')[0]
              }
            } 
            // Handle YYYY-MM-DD format
            else if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
              dateStr = dateValue
            }
            // Try parsing as date string
            else {
              const date = new Date(dateValue)
              if (!isNaN(date.getTime())) {
                dateStr = date.toISOString().split('T')[0]
              }
            }
          }
          // Handle Date object if somehow it appears (runtime check)
          else if (dateValue && typeof dateValue === 'object' && 'toISOString' in dateValue) {
            dateStr = (dateValue as Date).toISOString().split('T')[0]
          }
        } catch (e) {
          console.warn('Error parsing date:', e)
          dateStr = ''
        }
      }
      
      setFormData({
        title: activeProgram.title || '',
        date: dateStr,
        theme: activeProgram.theme || '',
        is_active: activeProgram.is_active ?? true
      })
    }
  }, [isEditing, activeProgram, id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Submit form - everything at once
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.church_id) {
      toast.error('User not authenticated')
      return
    }

    // Validation
    if (!formData.title.trim()) {
      toast.error('Program title is required')
      return
    }

    if (!formData.date) {
      toast.error('Program date is required')
      return
    }

    try {
      const programData = {
        title: formData.title.trim(),
        date: formData.date ? new Date(formData.date + 'T00:00:00').toISOString() : null,
        theme: formData.theme?.trim() || null,
        is_active: formData.is_active
      }

      if (isEditing && id) {
        await updateProgram(parseInt(id), programData)
        toast.success('Program updated successfully!')
        navigate('/admin/programs')
      } else {
        const program = await createProgram(programData)
        toast.success('Program created successfully!')
        navigate('/admin/programs')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to save program'
      toast.error(errorMessage)
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
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isEditing ? 'Edit Program' : 'Create New Program'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Update program details' : 'Fill in all program details below'}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/admin/programs')}
        >
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Program Details Section */}
        <ProgramDetailsForm
          formData={formData}
          onChange={handleChange}
        />

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/programs')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              isEditing ? 'Update Program' : 'Create Program'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default AdminProgramEditorPage
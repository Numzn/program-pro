import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProgramStore } from '../../store/programStore'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import ProgramDetailsForm from '../../components/ProgramDetailsForm'
import ScheduleItemsSection from '../../components/ScheduleItemsSection'
import SpecialGuestsSection from '../../components/SpecialGuestsSection'
import toast from 'react-hot-toast'
import { ScheduleItemInput, SpecialGuestInput } from '../../types'
import apiService from '../../services/api'

const AdminProgramEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  
  const { 
    activeProgram, 
    isLoading, 
    fetchProgramById, 
    bulkImportProgram,
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

  // Local state for schedule items (before saving)
  const [scheduleItems, setScheduleItems] = useState<ScheduleItemInput[]>([])

  // Local state for special guests (before saving)
  const [specialGuests, setSpecialGuests] = useState<SpecialGuestInput[]>([])

  // Reset form state when switching between create/edit modes or different programs
  useEffect(() => {
    if (!isEditing) {
      // Reset form when creating new program
      setFormData({ title: '', date: '', theme: '', is_active: true })
      setScheduleItems([])
      setSpecialGuests([])
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

      // Set schedule items and guests from loaded program
      setScheduleItems(activeProgram.schedule_items?.map(item => ({
        title: item.title,
        description: item.description,
        start_time: item.start_time || '',
        type: item.type,
        order_index: item.order_index
      })) || [])

      setSpecialGuests(activeProgram.special_guests?.map(guest => ({
        name: guest.name,
        role: guest.role,
        bio: guest.bio,
        photo_url: guest.photo_url,
        display_order: guest.display_order
      })) || [])
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
        is_active: formData.is_active,
        schedule_items: scheduleItems.map(item => {
          // Only include fields that exist in database - remove duration_minutes
          const cleanItem: Partial<ScheduleItemInput> = {
            title: item.title,
            type: item.type || 'worship',
            order_index: item.order_index ?? 0
          }
          if (item.description) cleanItem.description = item.description
          if (item.start_time) cleanItem.start_time = item.start_time
          // DO NOT include duration_minutes - column doesn't exist in DB
          return cleanItem
        }),
        special_guests: specialGuests
      }

      if (isEditing && id) {
        // For editing: update program, then delete old items/guests and add new ones
        await updateProgram(parseInt(id), {
          title: programData.title,
          date: programData.date,
          theme: programData.theme,
          is_active: programData.is_active
        })
        
        // Get current program from store - updateProgram already fetches and updates activeProgram
        // Use getState to get the latest value synchronously after updateProgram completes
        const currentProgram = useProgramStore.getState().activeProgram
        
        // Track errors for user notification
        const errors: string[] = []
        
        // Delete existing schedule items
        if (currentProgram?.schedule_items && currentProgram.schedule_items.length > 0) {
          for (const item of currentProgram.schedule_items) {
            try {
              await apiService.deleteScheduleItem(parseInt(id), item.id)
            } catch (error: any) {
              const errorMsg = error.message || 'Unknown error'
              errors.push(`Failed to delete schedule item "${item.title}": ${errorMsg}`)
              console.warn('Failed to delete schedule item:', error)
            }
          }
        }
        
        // Delete existing special guests
        if (currentProgram?.special_guests && currentProgram.special_guests.length > 0) {
          for (const guest of currentProgram.special_guests) {
            try {
              await apiService.deleteSpecialGuest(parseInt(id), guest.id)
            } catch (error: any) {
              const errorMsg = error.message || 'Unknown error'
              errors.push(`Failed to delete guest "${guest.name}": ${errorMsg}`)
              console.warn('Failed to delete special guest:', error)
            }
          }
        }
        
        // Add new schedule items
        for (const item of scheduleItems) {
          try {
            await apiService.addScheduleItem(parseInt(id), item)
          } catch (error: any) {
            const errorMsg = error.message || 'Unknown error'
            errors.push(`Failed to add schedule item "${item.title}": ${errorMsg}`)
            console.warn('Failed to add schedule item:', error)
          }
        }
        
        // Add new special guests
        for (const guest of specialGuests) {
          try {
            await apiService.addSpecialGuest(parseInt(id), guest)
          } catch (error: any) {
            const errorMsg = error.message || 'Unknown error'
            errors.push(`Failed to add guest "${guest.name}": ${errorMsg}`)
            console.warn('Failed to add special guest:', error)
          }
        }
        
        // Show appropriate message based on errors
        if (errors.length > 0) {
          toast.error(`Program updated but some operations failed: ${errors.join('; ')}`)
        } else {
          toast.success('Program updated successfully with all details!')
        }
        navigate('/admin/programs')
      } else {
        // Create new program with all data at once using bulk-import
        const program = await bulkImportProgram(programData)
        toast.success('Program created successfully with all details!')
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

        {/* Schedule Items Section */}
        <ScheduleItemsSection
          scheduleItems={scheduleItems}
          programDate={formData.date}
          onItemsChange={setScheduleItems}
        />

        {/* Special Guests Section */}
        <SpecialGuestsSection
          specialGuests={specialGuests}
          onGuestsChange={setSpecialGuests}
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
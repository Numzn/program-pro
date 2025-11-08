import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProgramStore } from '../../store/programStore'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import StepByStepForm from '../../components/StepByStepForm'
import { ScheduleItemInput, SpecialGuestInput } from '../../types'
import { saveProgramDraft, loadProgramDraft, clearProgramDraft } from '../../utils/localStorage'
import { useDebouncedCallback } from '../../hooks/useDebounce'
import toast from 'react-hot-toast'
import { Save, Trash2, Download, Clock } from 'lucide-react'

const normalizeTimeForState = (value?: string | null) => {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  const match = trimmed.match(/(\d{2}:\d{2})/)
  if (match) return match[1]
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed.slice(0, 5)
  }
  try {
    const parsed = new Date(trimmed)
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(11, 16)
    }
  } catch {
    // ignore parsing errors
  }
  return trimmed
}

const normalizeTimeForSubmission = (value?: string) => {
  const normalized = normalizeTimeForState(value)
  return normalized || undefined
}

const AdminProgramEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  
  const { 
    activeProgram, 
    isLoading, 
    fetchProgramById, 
    createProgram,
    updateProgram,
    bulkImportProgram,
    bulkUpdateProgram
  } = useProgramStore()
  const { user } = useAuthStore()
  
  // Program form data
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    theme: '',
    is_active: true
  })

  // Schedule items and special guests state
  const [scheduleItems, setScheduleItems] = useState<ScheduleItemInput[]>([])
  const [specialGuests, setSpecialGuests] = useState<SpecialGuestInput[]>([])
  
  // Draft management state
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const draftLoadedRef = useRef(false)

  // Get draft key for current program
  const draftKey = isEditing && id ? id : null

  // Load draft on mount
  useEffect(() => {
    if (draftLoadedRef.current) return
    
    const draft = loadProgramDraft(draftKey)
    if (draft) {
      const shouldLoad = window.confirm(
        `A draft was saved at ${new Date(draft.savedAt).toLocaleString()}. Would you like to load it?`
      )
      
      if (shouldLoad) {
        setFormData(draft.formData)
        setScheduleItems(draft.scheduleItems)
        setSpecialGuests(draft.specialGuests)
        setDraftSavedAt(new Date(draft.savedAt))
        toast.success('Draft loaded successfully')
      }
    }
    draftLoadedRef.current = true
  }, [draftKey])

  // Auto-save draft (debounced) - silent save, no toast notification
  const saveDraft = useDebouncedCallback(() => {
    // Skip save if form is empty
    if (!formData.title.trim() && !formData.date) {
      return
    }
    
    saveProgramDraft(draftKey, {
      formData,
      scheduleItems,
      specialGuests
    })
    
    setDraftSavedAt(new Date())
    setHasUnsavedChanges(false)
    // No toast notification for auto-save - only show on manual save
  }, 2000)

  // Save draft when data changes
  useEffect(() => {
    if (draftLoadedRef.current) {
      setHasUnsavedChanges(true)
      saveDraft()
    }
  }, [formData, scheduleItems, specialGuests, saveDraft])

  // Manual save draft
  const handleSaveDraft = () => {
    if (!formData.title.trim() && !formData.date) {
      toast.error('Please fill in at least title or date before saving draft')
      return
    }
    
    saveProgramDraft(draftKey, {
      formData,
      scheduleItems,
      specialGuests
    })
    
    setDraftSavedAt(new Date())
    setHasUnsavedChanges(false)
    toast.success('Draft saved successfully!')
  }

  // Clear draft
  const handleClearDraft = () => {
    const confirmed = window.confirm(
      'Are you sure you want to clear the draft? This action cannot be undone.'
    )
    
    if (confirmed) {
      clearProgramDraft(draftKey)
      setDraftSavedAt(null)
      setHasUnsavedChanges(false)
      toast.success('Draft cleared')
    }
  }

  // Load draft manually
  const handleLoadDraft = () => {
    const draft = loadProgramDraft(draftKey)
    if (draft) {
      const confirmed = window.confirm(
        'This will replace your current form data. Continue?'
      )
      
      if (confirmed) {
        setFormData(draft.formData)
        setScheduleItems(draft.scheduleItems)
        setSpecialGuests(draft.specialGuests)
        setDraftSavedAt(new Date(draft.savedAt))
        toast.success('Draft loaded successfully')
      }
    } else {
      toast.error('No draft found')
    }
  }

  // Reset form state when switching between create/edit modes or different programs
  useEffect(() => {
    if (!isEditing) {
      // Reset form when creating new program
      setFormData({ title: '', date: '', theme: '', is_active: true })
      setScheduleItems([])
      setSpecialGuests([])
      draftLoadedRef.current = false
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

      // Load schedule items and special guests
      setScheduleItems(
        activeProgram.schedule_items?.map(item => ({
          title: item.title,
          description: item.description,
          start_time: normalizeTimeForState(item.start_time),
          type: item.type || 'worship',
          order_index: item.order_index || 0,
          duration_minutes: item.duration_minutes
        })) || []
      )

      setSpecialGuests(
        activeProgram.special_guests?.map(guest => ({
          name: guest.name,
          role: guest.role,
          bio: guest.bio,
          photo_url: guest.photo_url,
          display_order: guest.display_order || 0
        })) || []
      )
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
    e.stopPropagation() // Prevent any bubbling
    
    console.log('📤 Form submission started', {
      isEditing,
      programId: id,
      title: formData.title,
      hasScheduleItems: scheduleItems.length,
      hasGuests: specialGuests.length
    })
    
    if (!user?.church_id) {
      toast.error('User not authenticated')
      return false
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
      // Clean and prepare schedule items data
      const cleanedScheduleItems = scheduleItems.map((item, index) => {
        const cleaned: any = {
          title: item.title?.trim() || '',
          type: item.type || 'worship',
          order_index: item.order_index ?? index
        }
        
        // Only include description if it has a value
        if (item.description && item.description.trim()) {
          cleaned.description = item.description.trim()
        }
        
        const normalizedStart = normalizeTimeForSubmission(item.start_time)
        if (normalizedStart) {
          cleaned.start_time = normalizedStart
        }
        
        // Only include duration_minutes if it exists
        if (item.duration_minutes !== undefined && item.duration_minutes !== null) {
          cleaned.duration_minutes = item.duration_minutes
        }
        
        return cleaned
      })
      
      // Clean and prepare special guests data
      const cleanedSpecialGuests = specialGuests.map((guest, index) => {
        const cleaned: any = {
          name: guest.name?.trim() || '',
          display_order: guest.display_order ?? index
        }
        
        // Only include optional fields if they have values
        if (guest.role?.trim()) {
          cleaned.role = guest.role.trim()
        }
        if (guest.bio?.trim()) {
          cleaned.bio = guest.bio.trim()
        }
        if (guest.photo_url?.trim()) {
          cleaned.photo_url = guest.photo_url.trim()
        }
        if (guest.description?.trim()) {
          cleaned.description = guest.description.trim()
        }
        
        return cleaned
      })
      
      const programData = {
        title: formData.title.trim(),
        date: formData.date ? new Date(formData.date + 'T00:00:00').toISOString() : null,
        theme: formData.theme?.trim() || null,
        is_active: formData.is_active,
        schedule_items: cleanedScheduleItems,
        special_guests: cleanedSpecialGuests
      }
      
      console.log('📤 Prepared program data for submission:', {
        isEditing,
        programId: id,
        title: programData.title,
        scheduleItemsCount: programData.schedule_items.length,
        specialGuestsCount: programData.special_guests.length,
        sampleScheduleItem: programData.schedule_items[0],
        sampleGuest: programData.special_guests[0]
      })

      // Save to localStorage before publishing
      saveProgramDraft(draftKey, {
        formData,
        scheduleItems,
        specialGuests
      })

      if (isEditing && id) {
        // Use bulk update - single API call
        await bulkUpdateProgram(parseInt(id), programData)
        clearProgramDraft(draftKey)
        toast.success('Program updated successfully!')
        navigate('/admin/programs')
      } else {
        // Use bulk import for creation
        await bulkImportProgram(programData)
        clearProgramDraft(draftKey)
        toast.success('Program created successfully!')
        navigate('/admin/programs')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to save program'
      toast.error(errorMessage)
      console.error('❌ Form submission error:', error)
    }
    
    return false // Prevent any default form behavior
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const hasDraft = loadProgramDraft(draftKey) !== null

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
        <div className="flex items-center gap-2">
          {hasDraft && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLoadDraft}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Load Draft
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => navigate('/admin/programs')}
          >
            Cancel
          </Button>
        </div>
      </div>

      {/* Draft Status Indicator */}
      {(draftSavedAt || hasUnsavedChanges) && (
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-blue-600" />
            {draftSavedAt ? (
              <span className="text-blue-800">
                Draft saved at {draftSavedAt.toLocaleString()}
              </span>
            ) : (
              <span className="text-blue-800">Unsaved changes</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Draft
            </Button>
            {draftSavedAt && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearDraft}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Clear Draft
              </Button>
            )}
          </div>
        </div>
      )}

      <form 
        onSubmit={handleSubmit} 
        className="space-y-6"
        action="#" 
        method="post"
        noValidate
      >
        <StepByStepForm
          formData={formData}
          scheduleItems={scheduleItems}
          specialGuests={specialGuests}
          onFormDataChange={handleChange}
          onScheduleItemsChange={setScheduleItems}
          onSpecialGuestsChange={setSpecialGuests}
        />

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/programs')}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleSaveDraft}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Draft
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            onClick={(e) => {
              // Additional safety - prevent any default behavior
              e.stopPropagation()
            }}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Publishing...
              </>
            ) : (
              isEditing ? 'Publish Update' : 'Publish Program'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default AdminProgramEditorPage
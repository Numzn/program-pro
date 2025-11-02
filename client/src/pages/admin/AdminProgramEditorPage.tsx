import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProgramStore } from '../../store/programStore'
import { useAuthStore } from '../../store/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import ScheduleItemsManager from '../../components/ScheduleItemsManager'
import SpecialGuestsManager from '../../components/SpecialGuestsManager'
import toast from 'react-hot-toast'

const AdminProgramEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  const [createdProgramId, setCreatedProgramId] = useState<number | null>(null)
  
  const { 
    activeProgram, 
    isLoading, 
    fetchProgramById, 
    createProgram, 
    updateProgram,
    addScheduleItem,
    updateScheduleItem,
    deleteScheduleItem,
    reorderScheduleItems,
    addSpecialGuest,
    updateSpecialGuest,
    deleteSpecialGuest,
    reorderSpecialGuests
  } = useProgramStore()
  const { user } = useAuthStore()
  
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    theme: '',
    is_active: true
  })

  useEffect(() => {
    if (isEditing && id) {
      console.log('🔄 Fetching program for edit, ID:', id)
      fetchProgramById(parseInt(id)).catch((error) => {
        console.error('Failed to fetch program:', error)
        toast.error('Failed to load program details')
      })
    }
  }, [isEditing, id, fetchProgramById])

  useEffect(() => {
    if (isEditing && activeProgram) {
      // Convert date to YYYY-MM-DD format for date input
      let dateStr = ''
      if (activeProgram.date) {
        try {
          const date = new Date(activeProgram.date)
          dateStr = date.toISOString().split('T')[0] // Extract YYYY-MM-DD
        } catch (e) {
          // If date is already in YYYY-MM-DD format, use it directly
          dateStr = activeProgram.date.includes('T') 
            ? activeProgram.date.split('T')[0]
            : activeProgram.date
        }
      }
      
      setFormData({
        title: activeProgram.title || '',
        date: dateStr,
        theme: activeProgram.theme || '',
        is_active: activeProgram.is_active ?? true
      })
      
      console.log('📝 Form data set from activeProgram:', {
        title: activeProgram.title,
        date: dateStr,
        theme: activeProgram.theme,
        is_active: activeProgram.is_active,
        hasScheduleItems: activeProgram.schedule_items?.length || 0,
        hasGuests: activeProgram.special_guests?.length || 0
      })
    }
  }, [isEditing, activeProgram])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.church_id) {
      toast.error('User not authenticated')
      return
    }

    try {
      if (isEditing && id) {
        await updateProgram(parseInt(id), formData)
        toast.success('Program updated successfully')
        // Stay on edit page - don't redirect so user can continue editing schedule/guests
      } else {
        // Create program and stay on page to allow adding schedule items and guests
        const newProgram = await createProgram(formData)
        toast.success('Program created successfully! You can now add schedule items and guests.')
        // Set the created program ID so the managers appear
        setCreatedProgramId(newProgram.id)
        // Fetch the full program details to show in managers
        await fetchProgramById(newProgram.id)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save program')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Debug logging to diagnose manager visibility issue
  useEffect(() => {
    console.log('📊 AdminProgramEditorPage State Debug:', {
      isEditing,
      id,
      createdProgramId,
      isLoading,
      hasActiveProgram: !!activeProgram,
      activeProgramId: activeProgram?.id,
      activeProgramTitle: activeProgram?.title,
      scheduleItemsCount: activeProgram?.schedule_items?.length || 0,
      guestsCount: activeProgram?.special_guests?.length || 0,
      willShowManagers: (isEditing || createdProgramId) && activeProgram
    })
  }, [isEditing, id, createdProgramId, isLoading, activeProgram])

  if (isLoading && isEditing) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isEditing ? 'Edit Program' : createdProgramId ? 'Program Created' : 'Create New Program'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Update program details' : createdProgramId ? 'Add schedule items and special guests below' : 'Set up a new church program'}
          </p>
        </div>
        {createdProgramId && (
          <Button
            variant="outline"
            onClick={() => navigate('/admin/programs')}
          >
            Done
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Program Details</CardTitle>
          <CardDescription>
            Basic information about your church program
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Program Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Sunday Morning Service"
              required
            />
            
            <Input
              label="Date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
            
            <Input
              label="Theme (Optional)"
              name="theme"
              value={formData.theme}
              onChange={handleChange}
              placeholder="e.g., Hope and Renewal"
            />
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="is_active"
                id="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="rounded border-input"
              />
              <label htmlFor="is_active" className="text-sm font-medium">
                Active (visible to congregation)
              </label>
            </div>
            
            <div className="flex items-center space-x-4 pt-4">
              {!createdProgramId && (
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
              )}
              
              {isEditing && !createdProgramId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/programs')}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {((isEditing || createdProgramId) && activeProgram) && (
        <div className="space-y-6">
          <ScheduleItemsManager
            programId={activeProgram.id}
            scheduleItems={activeProgram.schedule_items || []}
            onAdd={async (item) => {
              try {
                await addScheduleItem(activeProgram.id, item)
                toast.success('Schedule item added successfully')
              } catch (error: any) {
                toast.error(error.message || 'Failed to add schedule item')
              }
            }}
            onUpdate={async (itemId, item) => {
              try {
                await updateScheduleItem(activeProgram.id, itemId, item)
                toast.success('Schedule item updated successfully')
              } catch (error: any) {
                toast.error(error.message || 'Failed to update schedule item')
              }
            }}
            onDelete={async (itemId) => {
              try {
                await deleteScheduleItem(activeProgram.id, itemId)
                toast.success('Schedule item deleted successfully')
              } catch (error: any) {
                toast.error(error.message || 'Failed to delete schedule item')
              }
            }}
            onReorder={async (items) => {
              try {
                await reorderScheduleItems(activeProgram.id, items)
                toast.success('Schedule reordered successfully')
              } catch (error: any) {
                toast.error(error.message || 'Failed to reorder schedule')
              }
            }}
          />

          <SpecialGuestsManager
            programId={activeProgram.id}
            specialGuests={activeProgram.special_guests || []}
            onAdd={async (guest) => {
              try {
                await addSpecialGuest(activeProgram.id, guest)
                toast.success('Special guest added successfully')
              } catch (error: any) {
                toast.error(error.message || 'Failed to add special guest')
              }
            }}
            onUpdate={async (guestId, guest) => {
              try {
                await updateSpecialGuest(activeProgram.id, guestId, guest)
                toast.success('Special guest updated successfully')
              } catch (error: any) {
                toast.error(error.message || 'Failed to update special guest')
              }
            }}
            onDelete={async (guestId) => {
              try {
                await deleteSpecialGuest(activeProgram.id, guestId)
                toast.success('Special guest deleted successfully')
              } catch (error: any) {
                toast.error(error.message || 'Failed to delete special guest')
              }
            }}
            onReorder={async (guests) => {
              try {
                await reorderSpecialGuests(activeProgram.id, guests)
                toast.success('Guests reordered successfully')
              } catch (error: any) {
                toast.error(error.message || 'Failed to reorder guests')
              }
            }}
          />
        </div>
      )}
    </div>
  )
}

export default AdminProgramEditorPage
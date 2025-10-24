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
  
  const { 
    activeProgram, 
    isLoading, 
    fetchProgramById, 
    createProgram, 
    updateProgram,
    addScheduleItem,
    deleteScheduleItem,
    reorderScheduleItems,
    addSpecialGuest,
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
      fetchProgramById(parseInt(id))
    }
  }, [isEditing, id, fetchProgramById])

  useEffect(() => {
    if (isEditing && activeProgram) {
      setFormData({
        title: activeProgram.title,
        date: activeProgram.date,
        theme: activeProgram.theme || '',
        is_active: activeProgram.is_active
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
      } else {
        await createProgram(formData)
        toast.success('Program created successfully')
      }
      navigate('/admin/programs')
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

  if (isLoading && isEditing) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {isEditing ? 'Edit Program' : 'Create New Program'}
        </h1>
        <p className="text-muted-foreground">
          {isEditing ? 'Update program details' : 'Set up a new church program'}
        </p>
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
              
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/programs')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isEditing && activeProgram && (
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
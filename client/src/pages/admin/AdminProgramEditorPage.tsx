import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProgramStore } from '../../store/programStore'
import { useAuthStore } from '../../store/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import { ScheduleItem, SpecialGuest } from '../../types'
import { Plus, Trash2, Clock, ArrowUp, ArrowDown, Edit2, X, User } from 'lucide-react'
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
  const [scheduleItems, setScheduleItems] = useState<Omit<ScheduleItem, 'id' | 'program_id' | 'created_at'>[]>([])
  const [editingScheduleItemIndex, setEditingScheduleItemIndex] = useState<number | null>(null)
  const [newScheduleItem, setNewScheduleItem] = useState({
    title: '',
    description: '',
    start_time: '',
    type: 'worship' as const,
    duration_minutes: undefined as number | undefined
  })
  const [isAddingScheduleItem, setIsAddingScheduleItem] = useState(false)

  // Local state for special guests (before saving)
  const [specialGuests, setSpecialGuests] = useState<Omit<SpecialGuest, 'id' | 'program_id' | 'created_at'>[]>([])
  const [editingGuestIndex, setEditingGuestIndex] = useState<number | null>(null)
  const [newGuest, setNewGuest] = useState({
    name: '',
    role: '',
    bio: '',
    photo_url: ''
  })
  const [isAddingGuest, setIsAddingGuest] = useState(false)

  // Load program data when editing
  useEffect(() => {
    if (isEditing && id) {
      fetchProgramById(parseInt(id)).catch((error) => {
        console.error('Failed to fetch program:', error)
        toast.error('Failed to load program details')
      })
    }
  }, [isEditing, id, fetchProgramById])

  // Populate form when program loads
  useEffect(() => {
    if (isEditing && activeProgram && activeProgram.id === parseInt(id || '0')) {
      // Set form data
      let dateStr = ''
      if (activeProgram.date) {
        try {
          const dateValue = activeProgram.date
          if (typeof dateValue === 'string') {
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
              dateStr = dateValue
            } else {
              const date = new Date(dateValue)
              if (!isNaN(date.getTime())) {
                dateStr = date.toISOString().split('T')[0]
              }
            }
          }
        } catch (e) {
          console.warn('Error parsing date:', e)
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
        duration_minutes: undefined,
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

  // Schedule Items Management (Local State)
  const handleAddScheduleItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newScheduleItem.title.trim()) {
      toast.error('Schedule item title is required')
      return
    }

    const item: any = {
      title: newScheduleItem.title.trim(),
      description: newScheduleItem.description.trim() || undefined,
      type: newScheduleItem.type || 'worship',
      order_index: scheduleItems.length
    }

    if (newScheduleItem.start_time.trim()) {
      // Use program date if available, otherwise use today's date
      const dateToUse = formData.date || new Date().toISOString().split('T')[0]
      item.start_time = new Date(`${dateToUse}T${newScheduleItem.start_time}`).toISOString()
    }

    if (newScheduleItem.duration_minutes) {
      item.duration_minutes = newScheduleItem.duration_minutes
    }

    setScheduleItems([...scheduleItems, item])
    setNewScheduleItem({
      title: '',
      description: '',
      start_time: '',
      type: 'worship',
      duration_minutes: undefined
    })
    setIsAddingScheduleItem(false)
  }

  const handleDeleteScheduleItem = (index: number) => {
    setScheduleItems(scheduleItems.filter((_, i) => i !== index).map((item, i) => ({
      ...item,
      order_index: i
    })))
  }

  const handleMoveScheduleItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === scheduleItems.length - 1) return

    const newItems = [...scheduleItems]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const temp = newItems[index]
    newItems[index] = newItems[targetIndex]
    newItems[targetIndex] = temp
    newItems.forEach((item, i) => {
      item.order_index = i
    })
    setScheduleItems(newItems)
  }

  // Special Guests Management (Local State)
  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGuest.name.trim()) {
      toast.error('Guest name is required')
      return
    }

    const guest = {
      name: newGuest.name.trim(),
      role: newGuest.role.trim() || undefined,
      bio: newGuest.bio.trim() || undefined,
      photo_url: newGuest.photo_url.trim() || undefined,
      display_order: specialGuests.length
    }

    setSpecialGuests([...specialGuests, guest])
    setNewGuest({
      name: '',
      role: '',
      bio: '',
      photo_url: ''
    })
    setIsAddingGuest(false)
  }

  const handleDeleteGuest = (index: number) => {
    setSpecialGuests(specialGuests.filter((_, i) => i !== index).map((guest, i) => ({
      ...guest,
      display_order: i
    })))
  }

  const handleMoveGuest = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === specialGuests.length - 1) return

    const newGuests = [...specialGuests]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const temp = newGuests[index]
    newGuests[index] = newGuests[targetIndex]
    newGuests[targetIndex] = temp
    newGuests.forEach((guest, i) => {
      guest.display_order = i
    })
    setSpecialGuests(newGuests)
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
        schedule_items: scheduleItems.map(item => ({
          ...item,
          start_time: item.start_time || undefined
        })),
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
        
        // Fetch current program to get existing items/guests for deletion
        // updateProgram already fetches, but we'll fetch again to be sure we have latest
        await fetchProgramById(parseInt(id))
        
        // Get the program data from API directly to ensure we have current items
        const currentProgram = await apiService.getProgramById(parseInt(id))
        
        // Delete existing schedule items
        if (currentProgram?.schedule_items && currentProgram.schedule_items.length > 0) {
          for (const item of currentProgram.schedule_items) {
            try {
              await apiService.deleteScheduleItem(parseInt(id), item.id)
            } catch (error) {
              console.warn('Failed to delete schedule item:', error)
            }
          }
        }
        
        // Delete existing special guests
        if (currentProgram?.special_guests && currentProgram.special_guests.length > 0) {
          for (const guest of currentProgram.special_guests) {
            try {
              await apiService.deleteSpecialGuest(parseInt(id), guest.id)
            } catch (error) {
              console.warn('Failed to delete special guest:', error)
            }
          }
        }
        
        // Add new schedule items
        for (const item of scheduleItems) {
          try {
            await apiService.addScheduleItem(parseInt(id), item)
          } catch (error) {
            console.warn('Failed to add schedule item:', error)
          }
        }
        
        // Add new special guests
        for (const guest of specialGuests) {
          try {
            await apiService.addSpecialGuest(parseInt(id), guest)
          } catch (error) {
            console.warn('Failed to add special guest:', error)
          }
        }
        
        toast.success('Program updated successfully with all details!')
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

  if (isLoading && isEditing) {
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
        <Card>
          <CardHeader>
            <CardTitle>Program Details</CardTitle>
            <CardDescription>
              Basic information about your church program
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        {/* Schedule Items Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Schedule Items
            </CardTitle>
            <CardDescription>
              Add the items for your program schedule (order matters)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Schedule Items */}
            {scheduleItems.length > 0 && (
              <div className="space-y-2">
                {scheduleItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-4 border border-border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.title}</span>
                        {item.start_time && (
                          <span className="text-sm text-gray-500">
                            {new Date(item.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs rounded-full bg-primary/10 text-primary`}>
                          {item.type || 'worship'}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        onClick={() => handleMoveScheduleItem(index, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        onClick={() => handleMoveScheduleItem(index, 'down')}
                        disabled={index === scheduleItems.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        onClick={() => handleDeleteScheduleItem(index)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Schedule Item Form */}
            {isAddingScheduleItem ? (
              <form onSubmit={handleAddScheduleItem} className="space-y-4 p-4 border border-border rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Title"
                    value={newScheduleItem.title}
                    onChange={(e) => setNewScheduleItem(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Opening Prayer"
                    required
                  />
                  <Input
                    label="Start Time"
                    type="time"
                    value={newScheduleItem.start_time}
                    onChange={(e) => setNewScheduleItem(prev => ({ ...prev, start_time: e.target.value }))}
                  />
                </div>
                <Input
                  label="Description"
                  value={newScheduleItem.description}
                  onChange={(e) => setNewScheduleItem(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                />
                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select
                    value={newScheduleItem.type}
                    onChange={(e) => setNewScheduleItem(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full p-2 border rounded-md"
                    aria-label="Schedule item type"
                  >
                    <option value="worship">Worship</option>
                    <option value="sermon">Sermon</option>
                    <option value="announcement">Announcement</option>
                    <option value="special">Special</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm">Add Item</Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingScheduleItem(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                type="button"
                onClick={() => setIsAddingScheduleItem(true)}
                variant="outline"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Schedule Item
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Special Guests Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Special Guests
            </CardTitle>
            <CardDescription>
              Add guest speakers, musicians, or other special participants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Guests */}
            {specialGuests.length > 0 && (
              <div className="space-y-3">
                {specialGuests.map((guest, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 border border-border rounded-lg"
                  >
                    {guest.photo_url ? (
                      <img
                        src={guest.photo_url}
                        alt={guest.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-border"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border-2 border-border">
                        <User className="h-7 w-7 text-primary" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{guest.name}</h4>
                        {guest.role && (
                          <span className="text-sm text-gray-600">• {guest.role}</span>
                        )}
                      </div>
                      {guest.bio && (
                        <p className="text-sm text-gray-600">{guest.bio}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        onClick={() => handleMoveGuest(index, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        onClick={() => handleMoveGuest(index, 'down')}
                        disabled={index === specialGuests.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        onClick={() => handleDeleteGuest(index)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Guest Form */}
            {isAddingGuest ? (
              <form onSubmit={handleAddGuest} className="space-y-4 p-4 border border-border rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Name"
                    value={newGuest.name}
                    onChange={(e) => setNewGuest(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Pastor John Smith"
                    required
                  />
                  <Input
                    label="Role"
                    value={newGuest.role}
                    onChange={(e) => setNewGuest(prev => ({ ...prev, role: e.target.value }))}
                    placeholder="e.g., Guest Speaker"
                  />
                </div>
                <Input
                  label="Photo URL (Optional)"
                  value={newGuest.photo_url}
                  onChange={(e) => setNewGuest(prev => ({ ...prev, photo_url: e.target.value }))}
                  placeholder="https://example.com/photo.jpg"
                />
                <div>
                  <label className="block text-sm font-medium mb-2">Bio</label>
                  <textarea
                    value={newGuest.bio}
                    onChange={(e) => setNewGuest(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Brief biography or description"
                    className="w-full p-2 border rounded-md h-20 resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm">Add Guest</Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingGuest(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                type="button"
                onClick={() => setIsAddingGuest(true)}
                variant="outline"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Special Guest
              </Button>
            )}
          </CardContent>
        </Card>

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
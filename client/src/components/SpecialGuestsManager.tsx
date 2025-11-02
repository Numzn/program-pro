import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { SpecialGuest } from '../types'
import { Plus, Trash2, User, ArrowUp, ArrowDown, Edit2 } from 'lucide-react'

interface SpecialGuestsManagerProps {
  programId: number
  specialGuests: SpecialGuest[]
  onAdd: (guest: Omit<SpecialGuest, 'id' | 'program_id' | 'created_at'>) => Promise<void>
  onUpdate: (guestId: number, guest: Partial<SpecialGuest>) => Promise<void>
  onDelete: (id: number) => Promise<void>
  onReorder: (guests: SpecialGuest[]) => Promise<void>
}

const SpecialGuestsManager: React.FC<SpecialGuestsManagerProps> = ({
  // programId,
  specialGuests,
  onAdd,
  onUpdate,
  onDelete,
  onReorder
}) => {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [newGuest, setNewGuest] = useState({
    name: '',
    role: '',
    bio: '',
    photo_url: '',
    display_order: specialGuests.length
  })
  const [editingGuest, setEditingGuest] = useState({
    name: '',
    role: '',
    bio: '',
    photo_url: ''
  })

  const handleEdit = (guest: SpecialGuest) => {
    setEditingId(guest.id)
    setEditingGuest({
      name: guest.name,
      role: guest.role || '',
      bio: guest.bio || '',
      photo_url: guest.photo_url || ''
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingGuest({
      name: '',
      role: '',
      bio: '',
      photo_url: ''
    })
  }

  const handleUpdate = async (e: React.FormEvent, guestId: number) => {
    e.preventDefault()
    if (!editingGuest.name.trim()) return

    try {
      const cleanedGuest: any = {
        name: editingGuest.name,
        role: editingGuest.role.trim() || undefined,
        bio: editingGuest.bio.trim() || undefined,
        photo_url: editingGuest.photo_url.trim() || undefined
      }
      
      await onUpdate(guestId, cleanedGuest)
      setEditingId(null)
      setEditingGuest({
        name: '',
        role: '',
        bio: '',
        photo_url: ''
      })
    } catch (error) {
      console.error('Failed to update special guest:', error)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGuest.name.trim()) return

    try {
      // Clean up the data before sending
      const cleanedGuest = {
        ...newGuest,
        role: newGuest.role.trim() || undefined,
        bio: newGuest.bio.trim() || undefined,
        photo_url: newGuest.photo_url.trim() || undefined
      }
      
      await onAdd(cleanedGuest)
      setNewGuest({
        name: '',
        role: '',
        bio: '',
        photo_url: '',
        display_order: specialGuests.length
      })
      setIsAdding(false)
    } catch (error) {
      console.error('Failed to add special guest:', error)
    }
  }

  const handleMoveUp = async (index: number) => {
    if (index === 0) return
    const newGuests = [...specialGuests]
    const temp = newGuests[index]
    newGuests[index] = newGuests[index - 1]
    newGuests[index - 1] = temp
    
    // Update display_order values
    newGuests.forEach((guest, i) => {
      guest.display_order = i
    })
    
    await onReorder(newGuests)
  }

  const handleMoveDown = async (index: number) => {
    if (index === specialGuests.length - 1) return
    const newGuests = [...specialGuests]
    const temp = newGuests[index]
    newGuests[index] = newGuests[index + 1]
    newGuests[index + 1] = temp
    
    // Update display_order values
    newGuests.forEach((guest, i) => {
      guest.display_order = i
    })
    
    await onReorder(newGuests)
  }

  return (
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
        {/* Existing Special Guests */}
        {specialGuests.length > 0 && (
          <div className="space-y-3">
            {specialGuests.map((guest, index) => (
              editingId === guest.id ? (
                <form
                  key={guest.id}
                  onSubmit={(e) => handleUpdate(e, guest.id)}
                  className="space-y-4 p-6 border border-border rounded-lg gradient-card shadow-brand"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Name"
                      value={editingGuest.name}
                      onChange={(e) => setEditingGuest(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Pastor John Smith"
                      required
                    />
                    <Input
                      label="Role"
                      value={editingGuest.role}
                      onChange={(e) => setEditingGuest(prev => ({ ...prev, role: e.target.value }))}
                      placeholder="e.g., Guest Speaker"
                    />
                  </div>
                  
                  <Input
                    label="Photo URL (Optional)"
                    value={editingGuest.photo_url}
                    onChange={(e) => setEditingGuest(prev => ({ ...prev, photo_url: e.target.value }))}
                    placeholder="https://example.com/photo.jpg"
                  />
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Bio</label>
                    <textarea
                      value={editingGuest.bio}
                      onChange={(e) => setEditingGuest(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Brief biography or description"
                      className="w-full p-2 border rounded-md h-20 resize-none"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div
                  key={guest.id}
                  className="flex items-start gap-4 p-4 border border-border rounded-lg gradient-card hover:shadow-brand transition-all duration-200"
                >
                  {guest.photo_url ? (
                    <img
                      src={guest.photo_url}
                      alt={guest.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-border shadow-brand"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border-2 border-border shadow-brand">
                      <User className="h-7 w-7 text-primary" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
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
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === specialGuests.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(guest)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(guest.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            ))}
          </div>
        )}

        {/* Add New Special Guest */}
        {isAdding ? (
          <form onSubmit={handleAdd} className="space-y-4 p-6 border border-border rounded-lg gradient-card shadow-brand">
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
              <Button type="submit" size="sm">
                Add Guest
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAdding(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button
            onClick={() => setIsAdding(true)}
            variant="outline"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Special Guest
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default SpecialGuestsManager

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { SpecialGuestInput } from '../types'
import { Plus, Trash2, User, ArrowUp, ArrowDown } from 'lucide-react'
import toast from 'react-hot-toast'

interface SpecialGuestsSectionProps {
  specialGuests: SpecialGuestInput[]
  onGuestsChange: (guests: SpecialGuestInput[]) => void
}

const SpecialGuestsSection: React.FC<SpecialGuestsSectionProps> = ({
  specialGuests,
  onGuestsChange
}) => {
  const [isAdding, setIsAdding] = useState(false)
  const [newGuest, setNewGuest] = useState({
    name: '',
    role: '',
    bio: '',
    photo_url: ''
  })

  const handleAdd = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation() // Prevent bubbling to parent form
    }
    
    if (!newGuest.name.trim()) {
      toast.error('Guest name is required')
      return
    }

    const guest: SpecialGuestInput = {
      name: newGuest.name.trim(),
      role: newGuest.role.trim() || undefined,
      bio: newGuest.bio.trim() || undefined,
      photo_url: newGuest.photo_url.trim() || undefined,
      display_order: specialGuests.length
    }

    onGuestsChange([...specialGuests, guest])
    setNewGuest({ name: '', role: '', bio: '', photo_url: '' })
    setIsAdding(false)
    toast.success('Guest added (will save when you publish)')
  }

  const handleDelete = (index: number) => {
    onGuestsChange(
      specialGuests.filter((_, i) => i !== index).map((guest, i) => ({
        ...guest,
        display_order: i
      }))
    )
  }

  const handleMove = (index: number, direction: 'up' | 'down') => {
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
    onGuestsChange(newGuests)
  }

  const handleGuestChange = (
    index: number,
    field: keyof SpecialGuestInput,
    value: string
  ) => {
    const updated = specialGuests.map((guest, i) => {
      if (i !== index) return guest
      const next: SpecialGuestInput = { ...guest }
      if (field === 'name') {
        next.name = value
      } else if (field === 'role') {
        next.role = value || undefined
      } else if (field === 'bio') {
        next.bio = value || undefined
      } else if (field === 'photo_url') {
        next.photo_url = value || undefined
      } else if (field === 'description') {
        next.description = value || undefined
      }
      return next
    })
    onGuestsChange(updated)
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
        {specialGuests.length > 0 && (
          <div className="space-y-3">
            {specialGuests.map((guest, index) => (
              <div
                key={`${guest.name}-${guest.display_order}-${index}`}
                className="space-y-4 p-4 border border-border rounded-lg"
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    label="Name"
                    value={guest.name}
                    onChange={(e) => handleGuestChange(index, 'name', e.target.value)}
                    placeholder="Guest name"
                    required
                  />
                  <Input
                    label="Role"
                    value={guest.role || ''}
                    onChange={(e) => handleGuestChange(index, 'role', e.target.value)}
                    placeholder="Role or title"
                  />
                  <Input
                    label="Photo URL"
                    value={guest.photo_url || ''}
                    onChange={(e) => handleGuestChange(index, 'photo_url', e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                  />
                  <Input
                    label="Additional Notes"
                    value={guest.description || ''}
                    onChange={(e) => handleGuestChange(index, 'description', e.target.value)}
                    placeholder="Optional notes"
                  />
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Bio</label>
                    <textarea
                      value={guest.bio || ''}
                      onChange={(e) => handleGuestChange(index, 'bio', e.target.value)}
                      className="w-full min-h-[80px] p-2 border rounded-md text-sm"
                      placeholder="Short biography or introduction"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === specialGuests.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    onClick={() => handleDelete(index)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {isAdding ? (
          <div 
            className="space-y-4 p-4 border border-border rounded-lg"
            onKeyDown={(e) => {
              // Prevent form submission on Enter key
              if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
                e.preventDefault()
                e.stopPropagation()
              }
            }}
            onSubmit={(e) => {
              // Prevent any form submission from this section
              e.preventDefault()
              e.stopPropagation()
              return false
            }}
          >
            <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              ℹ️ This guest will be saved locally. It will be saved to the database when you click "Publish Program".
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Name"
                value={newGuest.name}
                onChange={(e) => setNewGuest(prev => ({ ...prev, name: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    e.stopPropagation()
                    handleAdd(e as any)
                  }
                }}
                placeholder="e.g., Bishop Maron Musonda"
                required
              />
              <Input
                label="Role"
                value={newGuest.role}
                onChange={(e) => setNewGuest(prev => ({ ...prev, role: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    e.stopPropagation()
                    handleAdd(e as any)
                  }
                }}
                placeholder="e.g., Bishop, Spel Ministries International"
              />
            </div>
            <Input
              label="Photo URL (Optional)"
              value={newGuest.photo_url}
              onChange={(e) => setNewGuest(prev => ({ ...prev, photo_url: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  e.stopPropagation()
                  handleAdd(e as any)
                }
              }}
              placeholder="https://example.com/photo.jpg"
            />
            <div>
              <label className="block text-sm font-medium mb-2">Bio</label>
              <textarea
                value={newGuest.bio}
                onChange={(e) => setNewGuest(prev => ({ ...prev, bio: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    e.stopPropagation()
                    handleAdd(e as any)
                  }
                }}
                placeholder="e.g., Guest Speaker from Kitwe"
                className="w-full p-2 border rounded-md h-20 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                type="button"
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleAdd(e)
                  return false
                }}
              >
                Add Guest
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsAdding(false)
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsAdding(true)
            }}
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

export default SpecialGuestsSection


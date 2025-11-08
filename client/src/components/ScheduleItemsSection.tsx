import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { ScheduleItemInput } from '../types'
import { Plus, Trash2, Clock, ArrowUp, ArrowDown } from 'lucide-react'
import toast from 'react-hot-toast'

interface ScheduleItemsSectionProps {
  scheduleItems: ScheduleItemInput[]
  programDate?: string
  onItemsChange: (items: ScheduleItemInput[]) => void
}

const TYPE_OPTIONS = [
  { value: 'worship', label: 'Worship' },
  { value: 'sermon', label: 'Sermon' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'special', label: 'Special' }
] as const

const formatTimeForInput = (value?: string) => {
  if (!value) return ''
  const trimmed = value.trim()
  if (/^\d{2}:\d{2}$/.test(trimmed)) return trimmed
  const isoMatch = trimmed.match(/T(\d{2}:\d{2})/)
  if (isoMatch) return isoMatch[1]
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed.slice(0, 5)
  return trimmed
}

const normalizeTimeValue = (value?: string) => {
  if (!value) return ''
  const trimmed = value.trim()
  if (/^\d{2}:\d{2}$/.test(trimmed)) return trimmed
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed.slice(0, 5)
  try {
    const parsed = new Date(trimmed)
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(11, 16)
    }
  } catch {
    // ignore parse errors and return raw value
  }
  return trimmed
}

const ScheduleItemsSection: React.FC<ScheduleItemsSectionProps> = ({
  scheduleItems,
  programDate: _programDate,
  onItemsChange
}) => {
  const [isAdding, setIsAdding] = useState(false)
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    start_time: '',
    type: 'worship' as const
  })

  const handleAdd = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation() // Prevent bubbling to parent form
    }
    
    console.log('📝 Adding schedule item (local only, no API call)', {
      newItem,
      programDate,
      currentItemsCount: scheduleItems.length
    })
    
    if (!newItem.title.trim()) {
      toast.error('Schedule item title is required')
      return
    }

    try {
      const item: ScheduleItemInput = {
        title: newItem.title.trim(),
        description: newItem.description.trim() || undefined,
        type: newItem.type || 'worship',
        order_index: scheduleItems.length,
        start_time: newItem.start_time.trim()
          ? normalizeTimeValue(newItem.start_time)
          : undefined
      }

      console.log('✅ Created schedule item object:', item)
      
      // This just updates local state - NO API CALL
      onItemsChange([...scheduleItems, item])
      
      console.log('✅ Schedule item added to local state successfully')
      
      setNewItem({ title: '', description: '', start_time: '', type: 'worship' })
      setIsAdding(false)
      
      toast.success('Schedule item added (will save when you publish)')
    } catch (error: any) {
      console.error('❌ Error adding schedule item locally:', error)
      toast.error(`Failed to add item: ${error.message || 'Unknown error'}`)
    }
  }

  const handleDelete = (index: number) => {
    onItemsChange(
      scheduleItems.filter((_, i) => i !== index).map((item, i) => ({
        ...item,
        order_index: i
      }))
    )
  }

  const handleMove = (index: number, direction: 'up' | 'down') => {
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
    onItemsChange(newItems)
  }

  const handleItemChange = (
    index: number,
    field: keyof ScheduleItemInput,
    value: string
  ) => {
    const updated = scheduleItems.map((item, i) => {
      if (i !== index) return item
      const next: ScheduleItemInput = { ...item }
      if (field === 'title' || field === 'description') {
        // allow empty string while editing
        ;(next as any)[field] = value
      } else if (field === 'start_time') {
        const normalized = normalizeTimeValue(value)
        next.start_time = normalized || undefined
      } else if (field === 'type') {
        next.type = (value as ScheduleItemInput['type']) || 'worship'
      }
      return next
    })
    onItemsChange(updated)
  }

  const handleDurationChange = (index: number, value: string) => {
    const parsed = value === '' ? undefined : Number(value)
    if (parsed !== undefined && (isNaN(parsed) || parsed < 0)) {
      return
    }
    const updated = scheduleItems.map((item, i) => {
      if (i !== index) return item
      return { ...item, duration_minutes: parsed }
    })
    onItemsChange(updated)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Schedule Items
        </CardTitle>
        <CardDescription>
          Manage the order and details of your program schedule
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {scheduleItems.length > 0 && (
          <div className="space-y-3">
            {scheduleItems.map((item, index) => (
              <div
                key={`${item.title}-${item.order_index}-${index}`}
                className="space-y-4 p-4 border border-border rounded-lg"
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    label="Title"
                    value={item.title}
                    onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                    placeholder="e.g., Opening Worship"
                  />
                  <Input
                    label="Start Time"
                    type="time"
                    value={formatTimeForInput(item.start_time)}
                    onChange={(e) => handleItemChange(index, 'start_time', e.target.value)}
                  />
                  <div>
                    <label className="block text-sm font-medium mb-2">Type</label>
                    <select
                      value={item.type || 'worship'}
                      onChange={(e) => handleItemChange(index, 'type', e.target.value)}
                      className="w-full p-2 border rounded-md text-sm"
                    >
                      {TYPE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Duration (minutes)"
                    type="number"
                    min={0}
                    value={
                      item.duration_minutes !== undefined && item.duration_minutes !== null
                        ? String(item.duration_minutes)
                        : ''
                    }
                    onChange={(e) => handleDurationChange(index, e.target.value)}
                    placeholder="Optional"
                  />
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={item.description || ''}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="w-full min-h-[80px] p-2 border rounded-md text-sm"
                      placeholder="e.g., Speaker: Rev. Isaac Mphande"
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
                      disabled={index === scheduleItems.length - 1}
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
              ℹ️ This item will be saved locally. It will be saved to the database when you click "Publish Program".
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Title"
                value={newItem.title}
                onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    e.stopPropagation()
                    handleAdd(e as any)
                  }
                }}
                placeholder="e.g., Conference Session"
                required
              />
              <Input
                label="Start Time"
                type="time"
                value={newItem.start_time}
                onChange={(e) => setNewItem(prev => ({ ...prev, start_time: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    e.stopPropagation()
                    handleAdd(e as any)
                  }
                }}
              />
            </div>
            <Input
              label="Description"
              value={newItem.description}
              onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  e.stopPropagation()
                  handleAdd(e as any)
                }
              }}
              placeholder="e.g., Speaker: Rev. Isaac Mphande"
            />
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={newItem.type}
                onChange={(e) => setNewItem(prev => ({ ...prev, type: e.target.value as any }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    e.stopPropagation()
                    handleAdd(e as any)
                  }
                }}
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
                Add Item
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
            onClick={() => {
              console.log('🔘 Add Schedule Item button clicked - opening form (local only)')
              setIsAdding(true)
            }}
            variant="outline"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Schedule Item
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default ScheduleItemsSection


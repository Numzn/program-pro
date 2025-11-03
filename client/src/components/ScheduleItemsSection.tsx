import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { ScheduleItem } from '../types'
import { Plus, Trash2, Clock, ArrowUp, ArrowDown } from 'lucide-react'
import toast from 'react-hot-toast'

interface ScheduleItemsSectionProps {
  scheduleItems: Omit<ScheduleItem, 'id' | 'program_id' | 'created_at'>[]
  programDate?: string
  onItemsChange: (items: Omit<ScheduleItem, 'id' | 'program_id' | 'created_at'>[]) => void
}

const ScheduleItemsSection: React.FC<ScheduleItemsSectionProps> = ({
  scheduleItems,
  programDate,
  onItemsChange
}) => {
  const [isAdding, setIsAdding] = useState(false)
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    start_time: '',
    type: 'worship' as const
  })

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.title.trim()) {
      toast.error('Schedule item title is required')
      return
    }

    const item: any = {
      title: newItem.title.trim(),
      description: newItem.description.trim() || undefined,
      type: newItem.type || 'worship',
      order_index: scheduleItems.length
    }

    if (newItem.start_time.trim()) {
      const dateToUse = programDate || new Date().toISOString().split('T')[0]
      item.start_time = new Date(`${dateToUse}T${newItem.start_time}`).toISOString()
    }

    onItemsChange([...scheduleItems, item])
    setNewItem({
      title: '',
      description: '',
      start_time: '',
      type: 'worship'
    })
    setIsAdding(false)
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

  return (
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

        {/* Add New Schedule Item Form */}
        {isAdding ? (
          <form onSubmit={handleAdd} className="space-y-4 p-4 border border-border rounded-lg">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Title"
                value={newItem.title}
                onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Opening Prayer"
                required
              />
              <Input
                label="Start Time"
                type="time"
                value={newItem.start_time}
                onChange={(e) => setNewItem(prev => ({ ...prev, start_time: e.target.value }))}
              />
            </div>
            <Input
              label="Description"
              value={newItem.description}
              onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description"
            />
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={newItem.type}
                onChange={(e) => setNewItem(prev => ({ ...prev, type: e.target.value as any }))}
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
                onClick={() => setIsAdding(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button
            type="button"
            onClick={() => setIsAdding(true)}
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


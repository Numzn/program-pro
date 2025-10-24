import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { ScheduleItem } from '../types'
import { Plus, Trash2, Clock, ArrowUp, ArrowDown } from 'lucide-react'

interface ScheduleItemsManagerProps {
  programId: number
  scheduleItems: ScheduleItem[]
  onAdd: (item: Omit<ScheduleItem, 'id' | 'program_id' | 'created_at'>) => Promise<void>
  onDelete: (id: number) => Promise<void>
  onReorder: (items: ScheduleItem[]) => Promise<void>
}

const ScheduleItemsManager: React.FC<ScheduleItemsManagerProps> = ({
  // programId,
  scheduleItems,
  onAdd,
  onDelete,
  onReorder
}) => {
  const [isAdding, setIsAdding] = useState(false)
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    start_time: '',
    type: 'worship' as const,
    order_index: scheduleItems.length
  })

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.title.trim()) return

    try {
      // Clean up the data before sending
      const cleanedItem = {
        ...newItem,
        start_time: newItem.start_time.trim() || undefined,
        description: newItem.description.trim() || undefined
      }
      
      await onAdd(cleanedItem)
      setNewItem({
        title: '',
        description: '',
        start_time: '',
        type: 'worship',
        order_index: scheduleItems.length
      })
      setIsAdding(false)
    } catch (error) {
      console.error('Failed to add schedule item:', error)
    }
  }

  const handleMoveUp = async (index: number) => {
    if (index === 0) return
    const newItems = [...scheduleItems]
    const temp = newItems[index]
    newItems[index] = newItems[index - 1]
    newItems[index - 1] = temp
    
    // Update order_index values
    newItems.forEach((item, i) => {
      item.order_index = i
    })
    
    await onReorder(newItems)
  }

  const handleMoveDown = async (index: number) => {
    if (index === scheduleItems.length - 1) return
    const newItems = [...scheduleItems]
    const temp = newItems[index]
    newItems[index] = newItems[index + 1]
    newItems[index + 1] = temp
    
    // Update order_index values
    newItems.forEach((item, i) => {
      item.order_index = i
    })
    
    await onReorder(newItems)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'worship': return 'bg-primary/10 text-primary border border-primary/20'
      case 'sermon': return 'bg-accent/10 text-accent border border-accent/20'
      case 'announcement': return 'bg-secondary/10 text-secondary border border-secondary/20'
      case 'special': return 'bg-sky/10 text-sky border border-sky/20'
      default: return 'bg-muted/10 text-muted-foreground border border-muted/20'
    }
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
        {/* Existing Schedule Items */}
        {scheduleItems.length > 0 && (
          <div className="space-y-2">
            {scheduleItems.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-4 border border-border rounded-lg gradient-card hover:shadow-brand transition-all duration-200"
              >
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(item.type)}`}>
                      {item.type}
                    </span>
                    <span className="font-medium">{item.title}</span>
                    {item.start_time && (
                      <span className="text-sm text-gray-500">{item.start_time}</span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-600">{item.description}</p>
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
                    disabled={index === scheduleItems.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(item.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New Schedule Item */}
        {isAdding ? (
          <form onSubmit={handleAdd} className="space-y-4 p-6 border border-border rounded-lg gradient-card shadow-brand">
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
              <Button type="submit" size="sm">
                Add Item
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
            Add Schedule Item
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default ScheduleItemsManager

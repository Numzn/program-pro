import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { ScheduleItemInput, SpecialGuestInput } from '../types'
import { FileText } from 'lucide-react'
import toast from 'react-hot-toast'

interface BulkEntryFormProps {
  onDataParsed: (data: {
    formData: {
      title: string
      date: string
      theme: string
      is_active: boolean
    }
    scheduleItems: ScheduleItemInput[]
    specialGuests: SpecialGuestInput[]
  }) => void
}

const BulkEntryForm: React.FC<BulkEntryFormProps> = ({ onDataParsed }) => {
  const [programText, setProgramText] = useState('')
  const [scheduleText, setScheduleText] = useState('')
  const [guestsText, setGuestsText] = useState('')
  const [preview, setPreview] = useState<any>(null)

  const parseProgramDetails = (text: string): Partial<{
    title: string
    date: string
    theme: string
    is_active: boolean
  }> => {
    const result: any = {
      is_active: true
    }

    text.split('\n').forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed) return

      const colonIndex = trimmed.indexOf(':')
      if (colonIndex === -1) return

      const key = trimmed.substring(0, colonIndex).trim().toLowerCase()
      const value = trimmed.substring(colonIndex + 1).trim()

      if (key === 'title') {
        result.title = value
      } else if (key === 'date') {
        result.date = value
      } else if (key === 'theme') {
        result.theme = value
      } else if (key === 'active' || key === 'is_active') {
        result.is_active = value.toLowerCase() === 'yes' || value.toLowerCase() === 'true'
      }
    })

    return result
  }

  const parseScheduleItems = (text: string): ScheduleItemInput[] => {
    const items: ScheduleItemInput[] = []
    let orderIndex = 0

    text.split('\n').forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed) return

      const parts = trimmed.split('|').map((p) => p.trim())
      
      if (parts.length >= 3) {
        const item: ScheduleItemInput = {
          title: parts[2] || '',
          description: parts.length > 4 ? parts[4] : undefined,
          type: (parts[3]?.toLowerCase() || 'worship') as any,
          order_index: orderIndex++
        }

        // Parse time (parts[1])
        if (parts[1]) {
          // Try to parse as HH:MM format
          const timeMatch = parts[1].match(/(\d{1,2}):(\d{2})/)
          if (timeMatch) {
            const today = new Date().toISOString().split('T')[0]
            item.start_time = new Date(`${today}T${parts[1]}`).toISOString()
          }
        }

        if (item.title) {
          items.push(item)
        }
      }
    })

    return items
  }

  const parseGuests = (text: string): SpecialGuestInput[] => {
    const guests: SpecialGuestInput[] = []
    let displayOrder = 0

    text.split('\n').forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed) return

      const parts = trimmed.split('|').map((p) => p.trim())
      
      if (parts.length >= 1 && parts[0]) {
        const guest: SpecialGuestInput = {
          name: parts[0],
          role: parts[1] || undefined,
          bio: parts.length > 2 ? parts.slice(2).join(' | ') : undefined,
          display_order: displayOrder++
        }

        guests.push(guest)
      }
    })

    return guests
  }

  const handleParse = () => {
    try {
      const formData = parseProgramDetails(programText)
      const scheduleItems = parseScheduleItems(scheduleText)
      const specialGuests = parseGuests(guestsText)

      // Validate required fields
      if (!formData.title || !formData.date) {
        toast.error('Program title and date are required')
        return
      }

      const parsedData = {
        formData: {
          title: formData.title || '',
          date: formData.date || '',
          theme: formData.theme || '',
          is_active: formData.is_active ?? true
        },
        scheduleItems,
        specialGuests
      }

      setPreview(parsedData)
      onDataParsed(parsedData)
      toast.success('Data parsed successfully!')
    } catch (error: any) {
      toast.error(`Failed to parse data: ${error.message}`)
    }
  }

  const loadSample = () => {
    setProgramText(`Title: 2025 Annual Conference
Date: 2025-10-23
Theme: THE GOD OF ALL FLESH
Active: yes`)

    setScheduleText(`Thursday, October 23 | 14:00 | Conference Session | sermon | Rev. Isaac Mphande
Friday, October 24 | 14:00 | Afternoon Session | sermon | Rev. Isaac Mphande`)

    setGuestsText(`Bishop Maron Musonda | Guest Speaker | Spel Ministries International
Bishop Davison Soko | Guest Speaker | Bigoca (Agape City)`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bulk Entry</h2>
          <p className="text-muted-foreground mt-1">
            Enter program data in text format for quick import
          </p>
        </div>
        <Button type="button" variant="outline" onClick={loadSample}>
          Load Sample
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Program Details</CardTitle>
          <CardDescription>
            Format: Field: Value (one per line)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={programText}
            onChange={(e) => setProgramText(e.target.value)}
            placeholder="Title: 2025 Annual Conference&#10;Date: 2025-10-23&#10;Theme: THE GOD OF ALL FLESH&#10;Active: yes"
            className="w-full p-3 border rounded-md font-mono text-sm min-h-[120px] resize-y"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schedule Items</CardTitle>
          <CardDescription>
            Format: Day | Time | Title | Type | Speaker (one per line)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={scheduleText}
            onChange={(e) => setScheduleText(e.target.value)}
            placeholder="Thursday, October 23 | 14:00 | Conference Session | sermon | Rev. Isaac Mphande"
            className="w-full p-3 border rounded-md font-mono text-sm min-h-[120px] resize-y"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Special Guests</CardTitle>
          <CardDescription>
            Format: Name | Role | Affiliation (one per line)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={guestsText}
            onChange={(e) => setGuestsText(e.target.value)}
            placeholder="Bishop Maron Musonda | Guest Speaker | Spel Ministries International"
            className="w-full p-3 border rounded-md font-mono text-sm min-h-[120px] resize-y"
          />
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button onClick={handleParse} className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Parse & Apply
        </Button>
      </div>

      {preview && (
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Parsed data structure</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto max-h-64 p-4 bg-white rounded border">
              {JSON.stringify(preview, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default BulkEntryForm


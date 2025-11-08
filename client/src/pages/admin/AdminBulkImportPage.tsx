import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ParsedProgram, ParseError } from '../../utils/templateParser'
import { useProgramStore } from '../../store/programStore'
import { useAuthStore } from '../../store/authStore'
import TemplateSaveDialog from '../../components/TemplateSaveDialog'
import TemplateLoadDialog from '../../components/TemplateLoadDialog'
import toast from 'react-hot-toast'

const CANONICAL_TYPES = ['worship', 'sermon', 'announcement', 'special'] as const
type CanonicalType = typeof CANONICAL_TYPES[number]

const TYPE_ALIASES: Record<string, CanonicalType> = {
  worship: 'worship',
  praise: 'worship',
  prayer: 'worship',
  service: 'worship',
  offertory: 'worship',
  offering: 'worship',
  worshipsession: 'worship',
  sermon: 'sermon',
  message: 'sermon',
  teaching: 'sermon',
  homily: 'sermon',
  announcement: 'announcement',
  announcements: 'announcement',
  welcome: 'announcement',
  arrival: 'announcement',
  registration: 'announcement',
  briefing: 'announcement',
  special: 'special',
  speech: 'special',
  keynote: 'special',
  break: 'special',
  fellowship: 'special',
  networking: 'special',
  conference: 'special',
  meeting: 'special',
  seminar: 'special'
}

const normalizeScheduleType = (rawType: string): CanonicalType => {
  const normalized = rawType.toLowerCase().replace(/\s+/g, '')
  return TYPE_ALIASES[normalized] ?? 'special'
}

const AdminBulkImportPage: React.FC = () => {
  const navigate = useNavigate()
  const { bulkImportProgram } = useProgramStore()
  const { user } = useAuthStore()
  
  const [templateText, setTemplateText] = useState('')
  const [parsedData, setParsedData] = useState<ParsedProgram | null>(null)
  const [parseErrors, setParseErrors] = useState<ParseError[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)

  const handleParse = async () => {
    if (!templateText.trim()) {
      toast.error('Please enter JSON template data')
      return
    }

    setIsParsing(true)
    setParseErrors([])
    setParsedData(null)

    try {
      // Parse JSON directly
      const parsedJson = JSON.parse(templateText)
      
      // Normalize schedule item types (handle case sensitivity and common variations)
      if (parsedJson.schedule_items && Array.isArray(parsedJson.schedule_items)) {
        parsedJson.schedule_items = parsedJson.schedule_items.map((item: any) => {
          if (item.type) {
            item.type = normalizeScheduleType(String(item.type))
          }
          return item
        })
      }
      
      // Validate required fields
      const errors: ParseError[] = []
      
      if (!parsedJson.title) {
        errors.push({ line: 0, message: 'Missing required field: title', section: 'program' })
      }
      if (!parsedJson.date) {
        errors.push({ line: 0, message: 'Missing required field: date', section: 'program' })
      }
      if (parsedJson.is_active === undefined) {
        errors.push({ line: 0, message: 'Missing required field: is_active', section: 'program' })
      }
      
      // Validate date format
      if (parsedJson.date && !/^\d{4}-\d{2}-\d{2}$/.test(parsedJson.date)) {
        errors.push({ line: 0, message: 'Date must be in YYYY-MM-DD format', section: 'program' })
      }
      
      // Validate schedule items
      if (parsedJson.schedule_items && Array.isArray(parsedJson.schedule_items)) {
        const validTypes = new Set<string>(CANONICAL_TYPES)
        const foundTypes = new Set<string>()
        
        parsedJson.schedule_items.forEach((item: any, index: number) => {
          if (!item.title) {
            errors.push({ line: 0, message: `Schedule item ${index + 1}: Missing title`, section: 'schedule' })
          }
          if (!item.type) {
            errors.push({ line: 0, message: `Schedule item ${index + 1}: Missing type`, section: 'schedule' })
          } else {
            foundTypes.add(item.type)
            if (!validTypes.has(item.type)) {
              errors.push({ line: 0, message: `Schedule item ${index + 1}: Invalid type "${item.type}". Must be one of: ${Array.from(validTypes).join(', ')}`, section: 'schedule' })
            }
          }
        })
        
        // If there are invalid types, show all found types for debugging
        if (errors.some(e => e.message.includes('Invalid type'))) {
          console.log('Found types in schedule items:', Array.from(foundTypes))
        }
      }
      
      // Validate and normalize special guests
      if (parsedJson.special_guests && Array.isArray(parsedJson.special_guests)) {
        parsedJson.special_guests.forEach((guest: any, index: number) => {
          if (!guest.name) {
            errors.push({ line: 0, message: `Guest ${index + 1}: Missing name`, section: 'guests' })
          }
          // Map affiliation to bio if bio is missing
          if (!guest.bio && guest.affiliation) {
            guest.bio = guest.affiliation
          }
          // Ensure display_order is set
          if (guest.display_order === undefined) {
            guest.display_order = index
          }
        })
      }
      
      if (errors.length > 0) {
        setParseErrors(errors)
        toast.error(`Found ${errors.length} validation errors`)
      } else {
        setParsedData(parsedJson)
        toast.success('JSON template parsed successfully!')
      }
    } catch (error) {
      const parseError = error instanceof SyntaxError ? 'Invalid JSON format' : 'Failed to parse template'
      setParseErrors([{ line: 0, message: parseError, section: 'program' }])
      toast.error(parseError)
      console.error('Parse error:', error)
    } finally {
      setIsParsing(false)
    }
  }

  const handleCreateProgram = async () => {
    if (!parsedData || !user?.church_id) {
      toast.error('No parsed data or user not authenticated')
      return
    }

    setIsCreating(true)

    try {
      const program = await bulkImportProgram({
        title: parsedData.title,
        date: parsedData.date,
        theme: parsedData.theme,
        is_active: parsedData.is_active,
        schedule_items: parsedData.schedule_items,
        special_guests: parsedData.special_guests
      })

      toast.success('Program created successfully!')
      navigate(`/admin/programs/${program.id}/edit`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to create program')
    } finally {
      setIsCreating(false)
    }
  }

  const loadSampleTemplate = () => {
    const sampleTemplate = {
      title: "Sample Sunday Service",
      date: "2025-01-15",
      theme: "Faith and Hope",
      is_active: true,
      schedule_items: [
        {
          title: "Welcome",
          description: "Welcome message and announcements",
          start_time: "09:00",
          type: "announcement",
          order_index: 0
        },
        {
          title: "Worship",
          description: "Praise and worship songs",
          start_time: "09:10",
          type: "worship",
          order_index: 1
        },
        {
          title: "Sermon",
          description: "Main message from the pastor",
          start_time: "09:30",
          type: "sermon",
          order_index: 2
        },
        {
          title: "Prayer",
          description: "Prayer time and intercession",
          start_time: "10:15",
          type: "worship",
          order_index: 3
        },
        {
          title: "Benediction",
          description: "Closing blessing and dismissal",
          start_time: "10:30",
          type: "worship",
          order_index: 4
        }
      ],
      special_guests: [
        {
          name: "Rev. John Smith",
          role: "Guest Pastor",
          bio: "Visiting minister from sister church",
          display_order: 0
        }
      ]
    }
    
    setTemplateText(JSON.stringify(sampleTemplate, null, 2))
    toast.success('Sample JSON template loaded')
  }

  const clearTemplate = () => {
    setTemplateText('')
    setParsedData(null)
    setParseErrors([])
  }

  const downloadTemplate = (templateType: 'conference' | 'weekly' | 'simple') => {
    const templates = {
      conference: {
        title: "2025 ANNUAL CONFERENCE",
        date: "2025-10-23",
        theme: "THE GOD OF ALL FLESH",
        is_active: true,
        schedule_items: [
          {
            title: "Conference Session",
            description: "Speaker: Rev. Isaac Mphande",
            start_time: "14:00",
            type: "sermon",
            order_index: 0
          },
          {
            title: "Afternoon Session",
            description: "Speaker: Rev. Isaac Mphande",
            start_time: "14:00",
            type: "sermon",
            order_index: 1
          },
          {
            title: "Evening Session",
            description: "Speaker: Bishop Maron Musonda",
            start_time: "16:00",
            type: "sermon",
            order_index: 2
          },
          {
            title: "Afternoon Session",
            description: "Speaker: Bishop Davison Soko",
            start_time: "14:00",
            type: "sermon",
            order_index: 3
          },
          {
            title: "Evening Session",
            description: "Speaker: Bishop Maron Musonda",
            start_time: "16:00",
            type: "sermon",
            order_index: 4
          },
          {
            title: "Afternoon Session",
            description: "Speaker: Bishop Davison Soko",
            start_time: "14:00",
            type: "sermon",
            order_index: 5
          },
          {
            title: "Evening Session",
            description: "Speaker: Bishop Maron Musonda",
            start_time: "16:00",
            type: "sermon",
            order_index: 6
          }
        ],
        special_guests: [
          {
            name: "Bishop Maron Musonda",
            role: "Bishop, Spel Ministries International",
            bio: "Guest Speaker",
            display_order: 0
          },
          {
            name: "Bishop Davison Soko",
            role: "Bishop, Bigoca (Agape City)",
            bio: "Guest Speaker from Kitwe",
            display_order: 1
          }
        ]
      },

      weekly: {
        title: "CHURCH WEEKLY SCHEDULE",
        date: "2025-01-05",
        theme: "Weekly Worship Service",
        is_active: true,
        schedule_items: [
          {
            title: "Welcome & Announcements",
            description: "Church announcements and updates",
            start_time: "09:00",
            type: "announcement",
            order_index: 0
          },
          {
            title: "Opening Prayer",
            description: "Prayer and invocation",
            start_time: "09:15",
            type: "worship",
            order_index: 1
          },
          {
            title: "Hymn Singing",
            description: "Congregational hymns",
            start_time: "09:20",
            type: "worship",
            order_index: 2
          },
          {
            title: "Scripture Reading",
            description: "Bible reading and meditation",
            start_time: "09:30",
            type: "worship",
            order_index: 3
          },
          {
            title: "Sermon",
            description: "Main message from the pastor",
            start_time: "09:35",
            type: "sermon",
            order_index: 4
          },
          {
            title: "Offering",
            description: "Collection and dedication",
            start_time: "10:30",
            type: "worship",
            order_index: 5
          },
          {
            title: "Closing Prayer",
            description: "Final prayer and benediction",
            start_time: "10:45",
            type: "worship",
            order_index: 6
          }
        ],
        special_guests: [
          {
            name: "Rev. John Smith",
            role: "Guest Pastor",
            bio: "Visiting minister from sister church",
            display_order: 0
          }
        ]
      },

      simple: {
        title: "Sunday Service",
        date: "2025-01-12",
        theme: "Faith and Hope",
        is_active: true,
        schedule_items: [
          {
            title: "Welcome",
            description: "Welcome message",
            start_time: "09:00",
            type: "announcement",
            order_index: 0
          },
          {
            title: "Worship",
            description: "Praise and worship",
            start_time: "09:10",
            type: "worship",
            order_index: 1
          },
          {
            title: "Sermon",
            description: "Main message",
            start_time: "09:30",
            type: "sermon",
            order_index: 2
          },
          {
            title: "Prayer",
            description: "Prayer time",
            start_time: "10:15",
            type: "worship",
            order_index: 3
          },
          {
            title: "Benediction",
            description: "Closing blessing",
            start_time: "10:30",
            type: "worship",
            order_index: 4
          }
        ],
        special_guests: []
      }
    }

    const template = templates[templateType]
    const jsonString = JSON.stringify(template, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${templateType}-template.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success(`${templateType.charAt(0).toUpperCase() + templateType.slice(1)} JSON template downloaded`)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'worship': return 'bg-gradient-to-r from-blue-400 to-blue-500 text-white'
      case 'sermon': return 'bg-gradient-to-r from-purple-400 to-purple-500 text-white'
      case 'announcement': return 'bg-gradient-to-r from-green-400 to-green-500 text-white'
      case 'special': return 'bg-gradient-to-r from-orange-400 to-orange-500 text-white'
      default: return 'bg-gray-200 text-gray-700'
    }
  }

  const templateDownloadOptions = [
    { label: 'Conference', value: 'conference' as const },
    { label: 'Weekly', value: 'weekly' as const },
    { label: 'Simple', value: 'simple' as const }
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl shadow-brand-lg p-8 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-foreground mb-1">Bulk Import</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Import a program from a JSON template, edit it, and save it instantly.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setShowLoadDialog(true)} className="shadow-brand">
              Load Template
            </Button>
            <Button variant="outline" onClick={loadSampleTemplate} className="shadow-brand">
              Load Sample
            </Button>
            <Button variant="ghost" onClick={clearTemplate} className="shadow-brand hover:bg-muted">
              Clear Editor
            </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Download templates:
              </span>
              {templateDownloadOptions.map((option) => (
                <Button
                  key={option.value}
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate(option.value)}
                  className="shadow-brand text-xs px-3 py-2"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Input Section */}
        <Card className="gradient-card shadow-brand">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white rounded"></div>
              </div>
              Template Input
            </CardTitle>
            <CardDescription>
              Paste your structured program data below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Program Template</label>
              <textarea
                value={templateText}
                onChange={(e) => setTemplateText(e.target.value)}
                placeholder='{&#10;  "title": "Your Program Title",&#10;  "date": "2025-01-01",&#10;  "theme": "Your Theme",&#10;  "is_active": true,&#10;  "schedule_items": [&#10;    {&#10;      "title": "Service",&#10;      "description": "Description",&#10;      "start_time": "09:00",&#10;      "type": "worship",&#10;      "order_index": 0&#10;    }&#10;  ],&#10;  "special_guests": [&#10;    {&#10;      "name": "Speaker Name",&#10;      "role": "Role",&#10;      "bio": "Bio",&#10;      "display_order": 0&#10;    }&#10;  ]&#10;}'
                className="w-full h-96 p-4 border border-border rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleParse} 
                disabled={isParsing || !templateText.trim()}
                className="flex-1 shadow-brand hover:shadow-brand-lg"
              >
                {isParsing ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Parsing...
                  </>
                ) : (
                  'Parse JSON'
                )}
              </Button>
            </div>

            {/* Template Downloads */}
            <div className="p-4 bg-gradient-to-r from-accent/10 to-secondary/10 rounded-lg border border-accent/20">
              <h4 className="font-semibold text-sm mb-3">Download Templates:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => downloadTemplate('conference')} 
                  className="text-xs h-8"
                  size="sm"
                >
                  Conference Template
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => downloadTemplate('weekly')} 
                  className="text-xs h-8"
                  size="sm"
                >
                  Weekly Template
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => downloadTemplate('simple')} 
                  className="text-xs h-8"
                  size="sm"
                >
                  Simple Template
                </Button>
              </div>
            </div>

            {/* Format Guide */}
            <div className="p-4 bg-muted/30 rounded-lg border-l-4 border-accent">
              <h4 className="font-semibold text-sm mb-2">JSON Format Guide:</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Required fields:</strong> title, date (YYYY-MM-DD), is_active (true/false)</p>
                <p><strong>Optional fields:</strong> theme, schedule_items, special_guests</p>
                <p><strong>Schedule types:</strong> worship, sermon, announcement, special</p>
                <p><strong>Auto-mapped types:</strong> seminar→special, service→worship, conference→special</p>
                <p><strong>Guest fields:</strong> name (required), role, bio/affiliation, display_order</p>
                <p><strong>Time format:</strong> HH:MM (24-hour format)</p>
                <p><strong>Download templates</strong> above for complete examples</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        <Card className="gradient-card shadow-brand">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white rounded-full"></div>
              </div>
              Preview
            </CardTitle>
            <CardDescription>
              Review parsed program data before creating
            </CardDescription>
          </CardHeader>
          <CardContent>
            {parseErrors.length > 0 && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <h4 className="font-semibold text-destructive mb-2">Parsing Errors:</h4>
                <div className="space-y-1">
                  {parseErrors.map((error, index) => (
                    <div key={index} className="text-sm text-destructive">
                      <span className="font-medium">Line {error.line}:</span> {error.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {parsedData ? (
              <div className="space-y-6">
                {/* Program Details */}
                <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
                  <h3 className="font-bold text-lg text-foreground mb-2">{parsedData.title}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Date:</span>
                      <span className="ml-2 text-foreground">{parsedData.date}</span>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${
                        parsedData.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {parsedData.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {parsedData.theme && (
                      <div className="col-span-2">
                        <span className="font-medium text-muted-foreground">Theme:</span>
                        <span className="ml-2 text-foreground">{parsedData.theme}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Schedule Items */}
                {parsedData.schedule_items.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Schedule Items ({parsedData.schedule_items.length})</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {parsedData.schedule_items.map((item, index) => (
                        <div key={index} className="p-3 bg-muted/30 rounded-lg border border-border/50">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-1 text-xs font-bold rounded ${getTypeColor(item.type)}`}>
                                  {item.type}
                                </span>
                                {item.start_time && (
                                  <span className="text-xs text-muted-foreground font-mono">
                                    {item.start_time}
                                  </span>
                                )}
                              </div>
                              <h5 className="font-medium text-foreground truncate">{item.title}</h5>
                              {item.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Special Guests */}
                {parsedData.special_guests.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Special Guests ({parsedData.special_guests.length})</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {parsedData.special_guests.map((guest, index) => (
                        <div key={index} className="p-3 bg-muted/30 rounded-lg border border-border/50">
                          <h5 className="font-medium text-foreground">{guest.name}</h5>
                          {guest.role && (
                            <p className="text-sm text-muted-foreground">{guest.role}</p>
                          )}
                          {guest.bio && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {guest.bio}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-4 border-t border-border/50">
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowSaveDialog(true)}
                      className="flex-1 shadow-brand hover:shadow-brand-lg"
                    >
                      Save as Template
                    </Button>
                    <Button
                      onClick={handleCreateProgram}
                      disabled={isCreating}
                      className="flex-1 shadow-brand hover:shadow-brand-lg"
                    >
                      {isCreating ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Creating Program...
                        </>
                      ) : (
                        'Create Program'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 border-2 border-muted rounded"></div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No preview available</h3>
                <p className="text-muted-foreground">
                  Parse a template to see the preview
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Template Dialogs */}
      <TemplateSaveDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        templateData={templateText}
        onSaved={() => {
          // Template saved successfully
        }}
      />
      
      <TemplateLoadDialog
        isOpen={showLoadDialog}
        onClose={() => setShowLoadDialog(false)}
        onLoad={(templateData) => {
          setTemplateText(templateData)
          setShowLoadDialog(false)
        }}
      />
    </div>
  )
}

export default AdminBulkImportPage

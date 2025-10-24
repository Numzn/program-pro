export interface ParsedProgram {
  title: string
  date: string
  theme?: string
  is_active: boolean
  schedule_items: ParsedScheduleItem[]
  special_guests: ParsedSpecialGuest[]
}

export interface ParsedScheduleItem {
  title: string
  description?: string
  start_time?: string
  type: 'worship' | 'sermon' | 'announcement' | 'special'
  order_index: number
}

export interface ParsedSpecialGuest {
  name: string
  role?: string
  bio?: string
  photo_url?: string
  display_order: number
}

export interface ParseError {
  line: number
  message: string
  section: 'program' | 'schedule' | 'guests'
}

export class TemplateParser {
  private errors: ParseError[] = []

  parseTemplate(templateText: string): { data?: ParsedProgram; errors: ParseError[] } {
    this.errors = []
    
    try {
      const lines = templateText.split('\n').map(line => line.trim())
      const sections = this.splitIntoSections(lines)
      
      const program = this.parseProgramSection(sections.program)
      const scheduleItems = this.parseScheduleSection(sections.schedule)
      const specialGuests = this.parseGuestsSection(sections.guests)
      
      if (this.errors.length > 0) {
        return { errors: this.errors }
      }
      
      return {
        data: {
          ...program,
          schedule_items: scheduleItems,
          special_guests: specialGuests
        },
        errors: []
      }
    } catch (error) {
      this.errors.push({
        line: 0,
        message: `Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        section: 'program'
      })
      return { errors: this.errors }
    }
  }

  private splitIntoSections(lines: string[]): {
    program: string[]
    schedule: string[]
    guests: string[]
  } {
    const sections = {
      program: [] as string[],
      schedule: [] as string[],
      guests: [] as string[]
    }
    
    let currentSection: keyof typeof sections = 'program'
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      if (line.toUpperCase() === 'PROGRAM:') {
        currentSection = 'program'
        continue
      } else if (line.toUpperCase() === 'SCHEDULE:') {
        currentSection = 'schedule'
        continue
      } else if (line.toUpperCase() === 'GUESTS:') {
        currentSection = 'guests'
        continue
      }
      
      if (line && !line.startsWith('#')) { // Ignore empty lines and comments
        sections[currentSection].push(line)
      }
    }
    
    return sections
  }

  private parseProgramSection(lines: string[]): Omit<ParsedProgram, 'schedule_items' | 'special_guests'> {
    const program: any = {
      is_active: true
    }
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const [key, ...valueParts] = line.split(':').map(s => s.trim())
      const value = valueParts.join(':').trim()
      
      if (!key || !value) continue
      
      switch (key.toLowerCase()) {
        case 'title':
          program.title = value
          break
        case 'date':
          if (!this.isValidDate(value)) {
            this.errors.push({
              line: i + 1,
              message: `Invalid date format: ${value}. Use YYYY-MM-DD`,
              section: 'program'
            })
          } else {
            program.date = value
          }
          break
        case 'theme':
          program.theme = value
          break
        case 'active':
          program.is_active = value.toLowerCase() === 'yes' || value.toLowerCase() === 'true'
          break
      }
    }
    
    // Validate required fields
    if (!program.title) {
      this.errors.push({
        line: 0,
        message: 'Program title is required',
        section: 'program'
      })
    }
    
    if (!program.date) {
      this.errors.push({
        line: 0,
        message: 'Program date is required',
        section: 'program'
      })
    }
    
    return program
  }

  private parseScheduleSection(lines: string[]): ParsedScheduleItem[] {
    const scheduleItems: ParsedScheduleItem[] = []
    let orderIndex = 0
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Skip day headers (e.g., "Thursday, October 23")
      if (line.includes(',') && !line.includes('|')) {
        continue
      }
      
      // Parse schedule item line: "HH:MM | Title | Type | Description"
      const parts = line.split('|').map(s => s.trim())
      
      if (parts.length < 3) {
        this.errors.push({
          line: i + 1,
          message: `Invalid schedule format: ${line}. Expected: "HH:MM | Title | Type | Description"`,
          section: 'schedule'
        })
        continue
      }
      
      const [time, title, type, description] = parts
      
      // Validate time format
      if (time && !this.isValidTime(time)) {
        this.errors.push({
          line: i + 1,
          message: `Invalid time format: ${time}. Use HH:MM`,
          section: 'schedule'
        })
        continue
      }
      
      // Validate type
      const validTypes = ['worship', 'sermon', 'announcement', 'special']
      if (!validTypes.includes(type.toLowerCase())) {
        this.errors.push({
          line: i + 1,
          message: `Invalid type: ${type}. Must be one of: ${validTypes.join(', ')}`,
          section: 'schedule'
        })
        continue
      }
      
      scheduleItems.push({
        title: title || 'Untitled',
        description: description || undefined,
        start_time: time || undefined,
        type: type.toLowerCase() as any,
        order_index: orderIndex++
      })
    }
    
    return scheduleItems
  }

  private parseGuestsSection(lines: string[]): ParsedSpecialGuest[] {
    const guests: ParsedSpecialGuest[] = []
    let displayOrder = 0
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      if (!line) continue
      
      // Parse guest line: "Name | Role | Bio"
      const parts = line.split('|').map(s => s.trim())
      
      if (parts.length < 1) {
        this.errors.push({
          line: i + 1,
          message: `Invalid guest format: ${line}. Expected: "Name | Role | Bio"`,
          section: 'guests'
        })
        continue
      }
      
      const [name, role, bio] = parts
      
      if (!name) {
        this.errors.push({
          line: i + 1,
          message: 'Guest name is required',
          section: 'guests'
        })
        continue
      }
      
      guests.push({
        name,
        role: role || undefined,
        bio: bio || undefined,
        display_order: displayOrder++
      })
    }
    
    return guests
  }

  private isValidDate(dateString: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(dateString)) return false
    
    const date = new Date(dateString)
    return date instanceof Date && !isNaN(date.getTime())
  }

  private isValidTime(timeString: string): boolean {
    const timeRegex = /^\d{2}:\d{2}$/
    if (!timeRegex.test(timeString)) return false
    
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
  }

  getSampleTemplate(): string {
    return `PROGRAM:
Title: 2025 ANNUAL CONFERENCE - THE GOD OF ALL FLESH
Date: 2025-10-23
Theme: THE GOD OF ALL FLESH - THE GATHERING OF THE SAINTS IN THE YEAR OF DIVINE SETTLEMENT (Jeremiah 32:27)
Active: yes

SCHEDULE:
Thursday, October 23
14:00 | Conference Session | sermon | Speaker: Rev. Isaac Mphande

Friday, October 24
14:00 | Afternoon Session | sermon | Speaker: Rev. Isaac Mphande
16:00 | Evening Session | sermon | Speaker: Bishop Maron Musonda

Saturday, October 25 (Leadership Seminar)
09:00 | Leadership Seminar - Morning | special | Speaker: Bishop Bizeck Ngwira
14:00 | Leadership Seminar - Afternoon | special | Speaker: Bishop Davison Soko
16:00 | Leadership Seminar - Evening | special | Speaker: Bishop Maron Musonda

Sunday, October 26
08:30 | 1st Service | worship | Speaker: Bishop Bizeck Ngwira
10:00 | 2nd Service | worship | Speaker: Bishop Davison Soko
14:00 | 3rd Service | worship | Speaker: Bishop Bizeck Ngwira

GUESTS:
Bishop Maron Musonda | Bishop, Spel Ministries International | Guest Speaker - Spel Ministries International
Bishop Davison Soko | Bishop, Bigoca (Agape City) | Guest Speaker from Bigoca (Agape City) - Kitwe
Dr. Bizeck Isaac Ngwira | Doctor of Ministry | Guest Speaker from Zambia
Reverend Isaac Mphande | Reverend, Cell Life Church International | Guest Speaker - Cell Life Church International`
  }
}

export const templateParser = new TemplateParser()

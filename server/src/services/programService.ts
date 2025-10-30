import DatabaseConnection from '../database/connection'

export interface Program {
  id: number
  church_id: number
  title: string
  date: string
  theme?: string
  is_active: boolean
  created_by: number
  created_at: string
  updated_at: string
}

export interface ScheduleItem {
  id: number
  program_id: number
  title: string
  description?: string
  start_time?: string
  order_index: number
  type: 'worship' | 'sermon' | 'announcement' | 'special'
  created_at: string
}

export interface SpecialGuest {
  id: number
  program_id: number
  name: string
  role?: string
  bio?: string
  photo_url?: string
  display_order: number
  created_at: string
}

export interface Resource {
  id: number
  program_id: number
  title: string
  url: string
  type: string
  description?: string
  created_at: string
}

export interface ProgramWithDetails extends Program {
  schedule_items: ScheduleItem[]
  special_guests: SpecialGuest[]
  resources: Resource[]
}

export class ProgramService {
  private db = DatabaseConnection.getInstance()

  async getPrograms(churchId?: number, isActive?: boolean): Promise<Program[]> {
    const connection = this.db.getConnection()
    let query = 'SELECT * FROM programs'
    const params: any[] = []
    const conditions: string[] = []

    if (churchId) {
      conditions.push('church_id = ?')
      params.push(churchId)
    }

    if (isActive !== undefined) {
      conditions.push('is_active = ?')
      params.push(isActive)
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    query += ' ORDER BY date DESC, created_at DESC'

    if (process.env.DATABASE_URL?.includes('postgres')) {
      const client = await (connection as any).connect()
      // Replace each '?' with $1, $2, ... in order
      let placeholderIndex = 0
      const pgQuery = query.replace(/\?/g, () => `$${++placeholderIndex}`)
      const result = await client.query(pgQuery, params)
      client.release()
      return result.rows
    } else {
      const stmt = (connection as any).prepare(query)
      return await stmt.all(...params)
    }
  }

  async getProgramById(id: number): Promise<ProgramWithDetails | null> {
    const connection = this.db.getConnection()

    let program
    if (process.env.DATABASE_URL?.includes('postgres')) {
      const client = await (connection as any).connect()
      const result = await client.query('SELECT * FROM programs WHERE id = $1', [id])
      client.release()
      program = result.rows[0]
    } else {
      const stmt = (connection as any).prepare('SELECT * FROM programs WHERE id = ?')
      program = await stmt.get(id)
    }

    if (!program) {
      return null
    }

    let scheduleItems, specialGuests, resources

    if (process.env.DATABASE_URL?.includes('postgres')) {
      const client = await (connection as any).connect()
      const schedule = await client.query(
        'SELECT * FROM schedule_items WHERE program_id = $1 ORDER BY order_index ASC',
        [id]
      )
      const guests = await client.query(
        'SELECT * FROM special_guests WHERE program_id = $1 ORDER BY display_order ASC',
        [id]
      )
      const res = await client.query(
        'SELECT * FROM resources WHERE program_id = $1',
        [id]
      )
      client.release()
      scheduleItems = schedule.rows
      specialGuests = guests.rows
      resources = res.rows
    } else {
      const scheduleStmt = (connection as any).prepare(
        'SELECT * FROM schedule_items WHERE program_id = ? ORDER BY order_index ASC'
      )
      const guestsStmt = (connection as any).prepare(
        'SELECT * FROM special_guests WHERE program_id = ? ORDER BY display_order ASC'
      )
      const resourcesStmt = (connection as any).prepare('SELECT * FROM resources WHERE program_id = ?')
      scheduleItems = await scheduleStmt.all(id)
      specialGuests = await guestsStmt.all(id)
      resources = await resourcesStmt.all(id)
    }

    return {
      ...program,
      schedule_items: scheduleItems,
      special_guests: specialGuests,
      resources
    }
  }

  async createProgram(data: Omit<Program, 'id' | 'created_at' | 'updated_at'>): Promise<Program> {
    const connection = this.db.getConnection()

    if (process.env.DATABASE_URL?.includes('postgres')) {
      const client = await (connection as any).connect()
      const result = await client.query(
        'INSERT INTO programs (church_id, title, date, theme, is_active, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [data.church_id, data.title, data.date, data.theme, data.is_active, data.created_by]
      )
      client.release()
      return result.rows[0]
    } else {
      const stmt = (connection as any).prepare(
        'INSERT INTO programs (church_id, title, date, theme, is_active, created_by) VALUES (?, ?, ?, ?, ?, ?)'
      )
      const result = await stmt.run(data.church_id, data.title, data.date, data.theme, data.is_active, data.created_by)
      
      const selectStmt = (connection as any).prepare('SELECT * FROM programs WHERE id = ?')
      return await selectStmt.get(result.lastInsertRowid)
    }
  }

  async updateProgram(id: number, data: Partial<Program>): Promise<Program | null> {
    const connection = this.db.getConnection()
    const fields = Object.keys(data).filter(key => data[key as keyof typeof data] !== undefined)
    
    if (fields.length === 0) {
      return this.getProgramById(id) as Promise<Program | null>
    }

    if (process.env.DATABASE_URL?.includes('postgres')) {
      const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ')
      const values = fields.map(field => data[field as keyof typeof data])
      values.push(id)

      const client = await (connection as any).connect()
      const result = await client.query(
        `UPDATE programs SET ${setClause} WHERE id = $${values.length} RETURNING *`,
        values
      )
      client.release()
      return result.rows[0] || null
    } else {
      const setClause = fields.map(field => `${field} = ?`).join(', ')
      const values = fields.map(field => data[field as keyof typeof data])
      values.push(id)

      const stmt = (connection as any).prepare(`UPDATE programs SET ${setClause} WHERE id = ?`)
      await stmt.run(...values)
      
      const selectStmt = (connection as any).prepare('SELECT * FROM programs WHERE id = ?')
      return await selectStmt.get(id)
    }
  }

  async deleteProgram(id: number): Promise<boolean> {
    const connection = this.db.getConnection()

    if (process.env.DATABASE_URL?.includes('postgres')) {
      const client = await (connection as any).connect()
      const result = await client.query('DELETE FROM programs WHERE id = $1', [id])
      client.release()
      return result.rowCount > 0
    } else {
      const stmt = (connection as any).prepare('DELETE FROM programs WHERE id = ?')
      const result = await stmt.run(id)
      return result.changes > 0
    }
  }

  async addScheduleItem(programId: number, data: Omit<ScheduleItem, 'id' | 'program_id' | 'created_at'>): Promise<ScheduleItem> {
    const connection = this.db.getConnection()

    if (process.env.DATABASE_URL?.includes('postgres')) {
      const client = await (connection as any).connect()
      const result = await client.query(
        'INSERT INTO schedule_items (program_id, title, description, start_time, order_index, type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [programId, data.title, data.description, data.start_time, data.order_index, data.type]
      )
      client.release()
      return result.rows[0]
    } else {
      const stmt = (connection as any).prepare(
        'INSERT INTO schedule_items (program_id, title, description, start_time, order_index, type) VALUES (?, ?, ?, ?, ?, ?)'
      )
      const result = await stmt.run(programId, data.title, data.description, data.start_time, data.order_index, data.type)
      
      const selectStmt = (connection as any).prepare('SELECT * FROM schedule_items WHERE id = ?')
      return await selectStmt.get(result.lastInsertRowid)
    }
  }

  async addSpecialGuest(programId: number, data: Omit<SpecialGuest, 'id' | 'program_id' | 'created_at'>): Promise<SpecialGuest> {
    const connection = this.db.getConnection()

    if (process.env.DATABASE_URL?.includes('postgres')) {
      const client = await (connection as any).connect()
      const result = await client.query(
        'INSERT INTO special_guests (program_id, name, role, bio, photo_url, display_order) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [programId, data.name, data.role, data.bio, data.photo_url, data.display_order]
      )
      client.release()
      return result.rows[0]
    } else {
      const stmt = (connection as any).prepare(
        'INSERT INTO special_guests (program_id, name, role, bio, photo_url, display_order) VALUES (?, ?, ?, ?, ?, ?)'
      )
      const result = await stmt.run(programId, data.name, data.role, data.bio, data.photo_url, data.display_order)
      
      const selectStmt = (connection as any).prepare('SELECT * FROM special_guests WHERE id = ?')
      return await selectStmt.get(result.lastInsertRowid)
    }
  }

  async createProgramWithDetails(data: {
    church_id: number
    title: string
    date: string
    theme?: string
    is_active: boolean
    created_by: number
    schedule_items: Array<Omit<ScheduleItem, 'id' | 'program_id' | 'created_at'>>
    special_guests: Array<Omit<SpecialGuest, 'id' | 'program_id' | 'created_at'>>
  }): Promise<ProgramWithDetails> {
    const connection = this.db.getConnection()

    try {
      // Start transaction
      if (process.env.DATABASE_URL?.includes('postgres')) {
        const client = await (connection as any).connect()
        
        try {
          await client.query('BEGIN')
          
          // Create program
          const programResult = await client.query(
            'INSERT INTO programs (church_id, title, date, theme, is_active, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [data.church_id, data.title, data.date, data.theme, data.is_active, data.created_by]
          )
          const program = programResult.rows[0]
          
          // Create schedule items
          const scheduleItems = []
          for (const item of data.schedule_items) {
            const result = await client.query(
              'INSERT INTO schedule_items (program_id, title, description, start_time, order_index, type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
              [program.id, item.title, item.description, item.start_time, item.order_index, item.type]
            )
            scheduleItems.push(result.rows[0])
          }
          
          // Create special guests
          const specialGuests = []
          for (const guest of data.special_guests) {
            const result = await client.query(
              'INSERT INTO special_guests (program_id, name, role, bio, photo_url, display_order) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
              [program.id, guest.name, guest.role, guest.bio, guest.photo_url, guest.display_order]
            )
            specialGuests.push(result.rows[0])
          }
          
          await client.query('COMMIT')
          client.release()
          
          return {
            ...program,
            schedule_items: scheduleItems,
            special_guests: specialGuests,
            resources: []
          }
        } catch (error) {
          await client.query('ROLLBACK')
          client.release()
          throw error
        }
      } else {
        // SQLite transaction
        const beginStmt = (connection as any).prepare('BEGIN TRANSACTION')
        const commitStmt = (connection as any).prepare('COMMIT')
        const rollbackStmt = (connection as any).prepare('ROLLBACK')
        
        try {
          await beginStmt.run()
          
          // Create program
          const programStmt = (connection as any).prepare(
            'INSERT INTO programs (church_id, title, date, theme, is_active, created_by) VALUES (?, ?, ?, ?, ?, ?)'
          )
          const programResult = await programStmt.run(
            data.church_id, data.title, data.date, data.theme, data.is_active, data.created_by
          )
          
          const programId = programResult.lastInsertRowid
          const selectProgramStmt = (connection as any).prepare('SELECT * FROM programs WHERE id = ?')
          const program = await selectProgramStmt.get(programId)
          
          // Create schedule items
          const scheduleItems = []
          const scheduleStmt = (connection as any).prepare(
            'INSERT INTO schedule_items (program_id, title, description, start_time, order_index, type) VALUES (?, ?, ?, ?, ?, ?)'
          )
          for (const item of data.schedule_items) {
            const result = await scheduleStmt.run(
              programId, item.title, item.description, item.start_time, item.order_index, item.type
            )
            const selectItemStmt = (connection as any).prepare('SELECT * FROM schedule_items WHERE id = ?')
            scheduleItems.push(await selectItemStmt.get(result.lastInsertRowid))
          }
          
          // Create special guests
          const specialGuests = []
          const guestStmt = (connection as any).prepare(
            'INSERT INTO special_guests (program_id, name, role, bio, photo_url, display_order) VALUES (?, ?, ?, ?, ?, ?)'
          )
          for (const guest of data.special_guests) {
            const result = await guestStmt.run(
              programId, guest.name, guest.role, guest.bio, guest.photo_url, guest.display_order
            )
            const selectGuestStmt = (connection as any).prepare('SELECT * FROM special_guests WHERE id = ?')
            specialGuests.push(await selectGuestStmt.get(result.lastInsertRowid))
          }
          
          await commitStmt.run()
          
          return {
            ...program,
            schedule_items: scheduleItems,
            special_guests: specialGuests,
            resources: []
          }
        } catch (error) {
          await rollbackStmt.run()
          throw error
        }
      }
    } catch (error) {
      throw new Error(`Failed to create program with details: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
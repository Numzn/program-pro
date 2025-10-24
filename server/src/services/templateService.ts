import DatabaseConnection from '../database/connection'

export interface ProgramTemplate {
  id: number
  church_id: number
  name: string
  description?: string
  template_data: string // JSON string
  created_at: string
}

export class TemplateService {
  private db = DatabaseConnection.getInstance()

  async getTemplates(churchId: number): Promise<ProgramTemplate[]> {
    const connection = this.db.getConnection()

    if (process.env.DATABASE_URL?.includes('postgres')) {
      const client = await (connection as any).connect()
      const result = await client.query(
        'SELECT * FROM program_templates WHERE church_id = $1 ORDER BY created_at DESC',
        [churchId]
      )
      client.release()
      return result.rows
    } else {
      const stmt = (connection as any).prepare(
        'SELECT * FROM program_templates WHERE church_id = ? ORDER BY created_at DESC'
      )
      return await stmt.all(churchId)
    }
  }

  async getTemplateById(id: number, churchId: number): Promise<ProgramTemplate | null> {
    const connection = this.db.getConnection()

    if (process.env.DATABASE_URL?.includes('postgres')) {
      const client = await (connection as any).connect()
      const result = await client.query(
        'SELECT * FROM program_templates WHERE id = $1 AND church_id = $2',
        [id, churchId]
      )
      client.release()
      return result.rows[0] || null
    } else {
      const stmt = (connection as any).prepare(
        'SELECT * FROM program_templates WHERE id = ? AND church_id = ?'
      )
      return await stmt.get(id, churchId)
    }
  }

  async createTemplate(data: {
    church_id: number
    name: string
    description?: string
    template_data: string
  }): Promise<ProgramTemplate> {
    const connection = this.db.getConnection()

    if (process.env.DATABASE_URL?.includes('postgres')) {
      const client = await (connection as any).connect()
      const result = await client.query(
        'INSERT INTO program_templates (church_id, name, description, template_data) VALUES ($1, $2, $3, $4) RETURNING *',
        [data.church_id, data.name, data.description, data.template_data]
      )
      client.release()
      return result.rows[0]
    } else {
      const stmt = (connection as any).prepare(
        'INSERT INTO program_templates (church_id, name, description, template_data) VALUES (?, ?, ?, ?)'
      )
      const result = await stmt.run(data.church_id, data.name, data.description, data.template_data)
      
      const selectStmt = (connection as any).prepare('SELECT * FROM program_templates WHERE id = ?')
      return await selectStmt.get(result.lastInsertRowid)
    }
  }

  async updateTemplate(id: number, churchId: number, data: {
    name?: string
    description?: string
    template_data?: string
  }): Promise<ProgramTemplate | null> {
    const connection = this.db.getConnection()
    const fields = Object.keys(data).filter(key => data[key as keyof typeof data] !== undefined)
    
    if (fields.length === 0) {
      return this.getTemplateById(id, churchId)
    }

    if (process.env.DATABASE_URL?.includes('postgres')) {
      const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ')
      const values = fields.map(field => data[field as keyof typeof data])
      values.push(id.toString(), churchId.toString())

      const client = await (connection as any).connect()
      const result = await client.query(
        `UPDATE program_templates SET ${setClause} WHERE id = $${values.length - 1} AND church_id = $${values.length} RETURNING *`,
        values
      )
      client.release()
      return result.rows[0] || null
    } else {
      const setClause = fields.map(field => `${field} = ?`).join(', ')
      const values = fields.map(field => data[field as keyof typeof data])
      values.push(id.toString(), churchId.toString())

      const stmt = (connection as any).prepare(`UPDATE program_templates SET ${setClause} WHERE id = ? AND church_id = ?`)
      await stmt.run(...values)
      
      return this.getTemplateById(id, churchId)
    }
  }

  async deleteTemplate(id: number, churchId: number): Promise<boolean> {
    const connection = this.db.getConnection()

    if (process.env.DATABASE_URL?.includes('postgres')) {
      const client = await (connection as any).connect()
      const result = await client.query(
        'DELETE FROM program_templates WHERE id = $1 AND church_id = $2',
        [id, churchId]
      )
      client.release()
      return result.rowCount > 0
    } else {
      const stmt = (connection as any).prepare(
        'DELETE FROM program_templates WHERE id = ? AND church_id = ?'
      )
      const result = await stmt.run(id.toString(), churchId.toString())
      return result.changes > 0
    }
  }
}

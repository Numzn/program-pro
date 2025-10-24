import DatabaseConnection from '../database/connection'

export interface Church {
  id: number
  name: string
  short_name?: string
  slug: string
  description?: string
  theme_config?: string
  created_at: string
}

export interface ChurchSettings {
  name: string
  short_name?: string
  description?: string
  theme_config?: string
}

export class ChurchService {
  private db = DatabaseConnection.getInstance()

  async getChurchById(id: number): Promise<Church | null> {
    const connection = this.db.getConnection()

    if (process.env.DATABASE_URL?.includes('postgres')) {
      const client = await (connection as any).connect()
      const result = await client.query('SELECT * FROM churches WHERE id = $1', [id])
      client.release()
      return result.rows[0] || null
    } else {
      const stmt = (connection as any).prepare('SELECT * FROM churches WHERE id = ?')
      return await stmt.get(id)
    }
  }

  async updateChurchSettings(id: number, settings: ChurchSettings): Promise<Church> {
    const connection = this.db.getConnection()

    if (process.env.DATABASE_URL?.includes('postgres')) {
      const client = await (connection as any).connect()
      
      try {
        const result = await client.query(
          'UPDATE churches SET name = $1, short_name = $2, description = $3, theme_config = $4 WHERE id = $5 RETURNING *',
          [settings.name, settings.short_name, settings.description, settings.theme_config, id]
        )
        client.release()
        return result.rows[0]
      } catch (error) {
        client.release()
        throw error
      }
    } else {
      const stmt = (connection as any).prepare(
        'UPDATE churches SET name = ?, short_name = ?, description = ?, theme_config = ? WHERE id = ?'
      )
      await stmt.run(settings.name, settings.short_name, settings.description, settings.theme_config, id)
      
      const selectStmt = (connection as any).prepare('SELECT * FROM churches WHERE id = ?')
      return await selectStmt.get(id)
    }
  }

  async createDefaultChurch(): Promise<Church> {
    const connection = this.db.getConnection()

    if (process.env.DATABASE_URL?.includes('postgres')) {
      const client = await (connection as any).connect()
      
      try {
        const result = await client.query(
          'INSERT INTO churches (name, short_name, slug, description) VALUES ($1, $2, $3, $4) RETURNING *',
          ['Grace Community Church', 'Grace Church', 'grace-community-church', 'Professional church program management and display']
        )
        client.release()
        return result.rows[0]
      } catch (error) {
        client.release()
        throw error
      }
    } else {
      const stmt = (connection as any).prepare(
        'INSERT INTO churches (name, short_name, slug, description) VALUES (?, ?, ?, ?)'
      )
      await stmt.run('Grace Community Church', 'Grace Church', 'grace-community-church', 'Professional church program management and display')
      
      const selectStmt = (connection as any).prepare('SELECT * FROM churches WHERE id = ?')
      return await selectStmt.get(1) // Assuming this is the first church
    }
  }
}

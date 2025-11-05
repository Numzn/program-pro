import { ScheduleItemInput, SpecialGuestInput } from '../types'

export interface DraftProgramData {
  id: string | null // 'new' or program ID
  formData: {
    title: string
    date: string
    theme: string
    is_active: boolean
  }
  scheduleItems: ScheduleItemInput[]
  specialGuests: SpecialGuestInput[]
  savedAt: string // ISO timestamp
  version: number // For future migrations
}

const DRAFT_VERSION = 1
const DRAFT_PREFIX = 'program-draft-'

/**
 * Get the localStorage key for a program draft
 */
function getDraftKey(id: string | null): string {
  return `${DRAFT_PREFIX}${id || 'new'}`
}

/**
 * Save program draft to localStorage
 */
export function saveProgramDraft(id: string | null, data: Omit<DraftProgramData, 'id' | 'savedAt' | 'version'>): void {
  try {
    const draft: DraftProgramData = {
      id,
      ...data,
      savedAt: new Date().toISOString(),
      version: DRAFT_VERSION
    }
    const key = getDraftKey(id)
    localStorage.setItem(key, JSON.stringify(draft))
  } catch (error) {
    console.error('Failed to save program draft to localStorage:', error)
  }
}

/**
 * Load program draft from localStorage
 */
export function loadProgramDraft(id: string | null): DraftProgramData | null {
  try {
    const key = getDraftKey(id)
    const stored = localStorage.getItem(key)
    if (!stored) {
      return null
    }
    
    const draft = JSON.parse(stored) as DraftProgramData
    
    // Validate version and migrate if needed (for future use)
    if (draft.version !== DRAFT_VERSION) {
      // Future: Add migration logic here if version changes
      console.warn(`Draft version mismatch: ${draft.version} vs ${DRAFT_VERSION}`)
    }
    
    return draft
  } catch (error) {
    console.error('Failed to load program draft from localStorage:', error)
    return null
  }
}

/**
 * Clear program draft from localStorage
 */
export function clearProgramDraft(id: string | null): void {
  try {
    const key = getDraftKey(id)
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Failed to clear program draft from localStorage:', error)
  }
}

/**
 * Get all program drafts from localStorage
 */
export function getAllDrafts(): DraftProgramData[] {
  const drafts: DraftProgramData[] = []
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(DRAFT_PREFIX)) {
        const stored = localStorage.getItem(key)
        if (stored) {
          try {
            const draft = JSON.parse(stored) as DraftProgramData
            drafts.push(draft)
          } catch (e) {
            // Skip invalid entries
            console.warn(`Failed to parse draft at key ${key}:`, e)
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to get all drafts from localStorage:', error)
  }
  
  return drafts.sort((a, b) => 
    new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  )
}


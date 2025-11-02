/**
 * JWT utility functions for decoding and managing tokens
 */

interface JWTPayload {
  sub?: string
  user_id?: number
  exp?: number
  [key: string]: any
}

/**
 * Decode JWT token and extract payload
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }
    
    const payload = parts[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded) as JWTPayload
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    return null
  }
}

/**
 * Get token expiration time in milliseconds
 * @param token - JWT token string
 * @returns Expiration timestamp in milliseconds, or null if invalid
 */
export function getTokenExpiration(token: string): number | null {
  const payload = decodeJWT(token)
  if (!payload || !payload.exp) {
    return null
  }
  
  // JWT exp is in seconds, convert to milliseconds
  return payload.exp * 1000
}

/**
 * Check if token is expiring soon
 * @param token - JWT token string
 * @param bufferMinutes - Minutes before expiry to consider "soon" (default: 2)
 * @returns true if token expires within buffer time
 */
export function isTokenExpiringSoon(token: string, bufferMinutes: number = 2): boolean {
  const expiration = getTokenExpiration(token)
  if (!expiration) {
    return true // Treat invalid tokens as expiring
  }
  
  const now = Date.now()
  const bufferMs = bufferMinutes * 60 * 1000
  return expiration - now <= bufferMs
}

/**
 * Calculate milliseconds until token should be refreshed
 * @param token - JWT token string
 * @param bufferMinutes - Minutes before expiry to refresh (default: 2)
 * @returns Milliseconds until refresh time, or null if invalid
 */
export function getTimeUntilRefresh(token: string, bufferMinutes: number = 2): number | null {
  const expiration = getTokenExpiration(token)
  if (!expiration) {
    return null
  }
  
  const now = Date.now()
  const bufferMs = bufferMinutes * 60 * 1000
  const refreshTime = expiration - bufferMs
  
  const timeUntilRefresh = refreshTime - now
  return timeUntilRefresh > 0 ? timeUntilRefresh : 0
}


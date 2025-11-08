export const parseLocalDate = (dateString: string): Date | null => {
  if (!dateString) return null
  const trimmed = dateString.trim()
  if (!trimmed) return null

  const [datePart] = trimmed.split('T')
  const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) {
    const [, yearStr, monthStr, dayStr] = match
    const year = Number(yearStr)
    const month = Number(monthStr)
    const day = Number(dayStr)
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month - 1, day)
    }
  }

  const parsed = new Date(trimmed)
  if (!isNaN(parsed.getTime())) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
  }

  return null
}

export const formatDate = (dateString: string): string => {
  const date = parseLocalDate(dateString)
  if (!date) return ''
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

export const isToday = (dateString: string): boolean => {
  const today = new Date()
  const date = parseLocalDate(dateString)
  return date?.toDateString() === today.toDateString()
}

export const formatDateShort = (dateString: string): string => {
  const date = parseLocalDate(dateString)
  if (!date) return ''
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
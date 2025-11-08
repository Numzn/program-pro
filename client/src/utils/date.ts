const createLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

export const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  const date = createLocalDate(dateString)
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
  const date = createLocalDate(dateString)
  return date.toDateString() === today.toDateString()
}
// Display helpers shared by the views

export const fullName = (user?: { user_first_name?: string | null; user_last_name?: string | null } | null) =>
  user ? [user.user_first_name, user.user_last_name].filter(Boolean).join(' ') : ''

export const formatDate = (value?: string | Date | null) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export const formatDateTime = (value?: string | Date | null) =>
  value
    ? new Date(value).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '—'

export const formatTime = (value?: string | Date | null) =>
  value ? new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''

export const formatDuration = (seconds?: number | null) => {
  if (!seconds) {
    return ''
  }

  const minutes = Math.floor(seconds / 60)
  const rest = Math.floor(seconds % 60)

  return `${minutes}:${String(rest).padStart(2, '0')}`
}

export const daysUntil = (value?: string | null) => {
  if (!value) {
    return null
  }

  return Math.ceil((new Date(value).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
}

export const WEEKDAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' }
]

export const formatFileSize = (bytes: number) =>
  bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`

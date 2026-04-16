export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validatePassword(password) {
  if (password.length < 8) return 'Password must be at least 8 characters'
  if (!/\d/.test(password)) return 'Password must contain at least 1 number'
  return null
}

export function formatRelativeTime(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr  = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffMin < 1)   return 'just now'
  if (diffMin < 60)  return `${diffMin}m ago`
  if (diffHr  < 24)  return `${diffHr}h ago`
  if (diffDay < 7)   return `${diffDay}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function getBlockPlaceholder(type) {
  const map = {
    paragraph:  'Type something, or / for commands…',
    heading_1:  'Heading 1',
    heading_2:  'Heading 2',
    code:       '// Write your code here…',
    image:      'Paste image URL…',
    to_do:      'To-do',
    divider:    '',
  }
  return map[type] ?? ''
}
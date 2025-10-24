const INVALID = 'INVALID_TIME_FORMAT'

// ---- Constants (avoid magic numbers) ----
const MINUTES_MAX = 59
const HOUR_24_MAX = 23

// Normalize input separators to colon
const normalizeSeparators = (str) => {
  return str
    .replace(/[;.-]/g, ':') // Replace ; . - with :
    .replace(/\s+/g, '') // Remove all spaces
}

// Parse time string into hours and minutes
const parseHourMinuteSimple = (str) => {
  const [h, m] = str.split(':')
  const hours = Number.parseInt(h, 10)
  const minutes = Number.parseInt(m, 10)

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null
  }

  return { hours, minutes }
}

// Validate time in 24hr format
const validate24HrTime = (hours, minutes) => {
  if (
    hours < 0 || hours > HOUR_24_MAX ||
    minutes < 0 || minutes > MINUTES_MAX
  ) {
    return null
  }

  return { hours, minutes }
}

// Format final output
const formatOutput24hr = (hours, minutes) => {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

// Main function
const formatTime24hr = (input) => {
  const raw = String(input).trim()
  if (!raw) {
    return INVALID
  }

  // Normalize separators
  const normalized = normalizeSeparators(raw)

  // Only support "H:M" style with one colon
  if (!/^\d{1,2}:\d{1,2}$/.test(normalized)) {
    return INVALID
  }

  // Parse time
  const parsed = parseHourMinuteSimple(normalized)
  if (!parsed) {
    return INVALID
  }

  // Validate time
  const validated = validate24HrTime(parsed.hours, parsed.minutes)
  if (!validated) {
    return INVALID
  }

  // Format and return
  return formatOutput24hr(validated.hours, validated.minutes)
}

export {
  formatTime24hr
}

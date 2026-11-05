export type DateDisplayPreferences = {
  date_format: string
  timezone: string
}

export const DEFAULT_DATE_PREFERENCES: DateDisplayPreferences = {
  date_format: 'DD/MM/YYYY',
  timezone: 'Africa/Johannesburg',
}

export const SUPPORTED_DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY'] as const
export const SUPPORTED_TIMEZONES = [
  'Africa/Johannesburg',
  'UTC',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Dubai',
] as const

function isSupportedDateFormat(
  value: unknown
): value is (typeof SUPPORTED_DATE_FORMATS)[number] {
  return (
    typeof value === 'string' &&
    SUPPORTED_DATE_FORMATS.some((format) => format === value)
  )
}

function isSupportedTimezone(
  value: unknown
): value is (typeof SUPPORTED_TIMEZONES)[number] {
  return (
    typeof value === 'string' &&
    SUPPORTED_TIMEZONES.some((timezone) => timezone === value)
  )
}

export function normalizeDatePreferences(
  preferences: Partial<DateDisplayPreferences> | null | undefined
): DateDisplayPreferences {
  return {
    date_format: isSupportedDateFormat(preferences?.date_format)
      ? preferences.date_format
      : DEFAULT_DATE_PREFERENCES.date_format,
    timezone: isSupportedTimezone(preferences?.timezone)
      ? preferences.timezone
      : DEFAULT_DATE_PREFERENCES.timezone,
  }
}

export function formatAppDate(
  value: string | null | undefined,
  preferences: DateDisplayPreferences,
  includeTime = false
): string {
  if (!value) return ''

  const { date_format: dateFormat, timezone } =
    normalizeDatePreferences(preferences)
  let year: string
  let month: string
  let day: string
  let time = ''

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (dateOnly) {
    year = dateOnly[1]
    month = dateOnly[2]
    day = dateOnly[3]
    const parsedDate = new Date(`${value}T00:00:00.000Z`)
    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== value
    ) {
      return 'Invalid date'
    }
  } else {
    const parsedDate = new Date(value)
    if (Number.isNaN(parsedDate.getTime())) return 'Invalid date'

    const parts = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(parsedDate)
    year = parts.find((part) => part.type === 'year')!.value
    month = parts.find((part) => part.type === 'month')!.value
    day = parts.find((part) => part.type === 'day')!.value

    if (includeTime) {
      time = new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).format(parsedDate)
    }
  }

  const formattedDate =
    dateFormat === 'MM/DD/YYYY'
      ? `${month}/${day}/${year}`
      : `${day}/${month}/${year}`
  return time ? `${formattedDate} ${time}` : formattedDate
}

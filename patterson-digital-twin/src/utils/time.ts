export function getIsoDateStamp(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function formatUsDate(
  date: Date = new Date(),
  options: Intl.DateTimeFormatOptions = { month: 'short', day: '2-digit', year: 'numeric' }
): string {
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

export function formatUsDateInTimeZone(
  date: Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat('en-US', { ...options, timeZone }).format(date);
}

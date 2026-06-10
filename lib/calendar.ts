// Generates RFC 5545 .ics calendar invite content

interface CalendarEventOptions {
  title: string
  description?: string
  // date in YYYY-MM-DD, times in HH:MM or HH:MM:SS (local/floating time)
  date: string
  startTime: string
  endTime: string
  organizerName: string
  organizerEmail: string
  attendeeName: string
  attendeeEmail: string
  // a stable id so updates replace the same event instead of duplicating
  uid: string
  // CONFIRMED for new/reschedule, CANCELLED to remove from calendars
  status?: 'CONFIRMED' | 'CANCELLED'
  // increment on each update so calendars apply the latest version
  sequence?: number
}

// Turn "2026-06-05" + "14:30" into "20260605T143000"
function toICSDateTime(date: string, time: string): string {
  const datePart = date.replace(/-/g, '')
  const [h = '00', m = '00', s = '00'] = time.split(':')
  const pad = (v: string) => v.padStart(2, '0')
  return `${datePart}T${pad(h)}${pad(m)}${pad(s)}`
}

function toICSStampUTC(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

// Escape special characters per the iCalendar spec
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

export function generateICS(options: CalendarEventOptions): string {
  const {
    title,
    description = '',
    date,
    startTime,
    endTime,
    organizerName,
    organizerEmail,
    attendeeName,
    attendeeEmail,
    uid,
    status = 'CONFIRMED',
    sequence = 0,
  } = options

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Chrono//CodeNation-studio//EN',
    'CALSCALE:GREGORIAN',
    status === 'CANCELLED' ? 'METHOD:CANCEL' : 'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `SEQUENCE:${sequence}`,
    `DTSTAMP:${toICSStampUTC(new Date())}`,
    `DTSTART:${toICSDateTime(date, startTime)}`,
    `DTEND:${toICSDateTime(date, endTime)}`,
    `SUMMARY:${escapeICS(title)}`,
    description ? `DESCRIPTION:${escapeICS(description)}` : '',
    `STATUS:${status}`,
    `ORGANIZER;CN=${escapeICS(organizerName)}:mailto:${organizerEmail}`,
    `ATTENDEE;CN=${escapeICS(attendeeName)};RSVP=TRUE:mailto:${attendeeEmail}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)

  // iCalendar requires CRLF line endings
  return lines.join('\r\n')
}

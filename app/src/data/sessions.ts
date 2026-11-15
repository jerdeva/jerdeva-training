import type { Session } from '../types'

export function toIsoDate(d: Date = new Date()): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  return toIsoDate(d)
}

const MONTHS_GENITIVE_UK = [
  'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
  'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня',
]

const MONTHS_SHORT_UK = [
  'січ', 'лют', 'бер', 'кві', 'тра', 'чер',
  'лип', 'сер', 'вер', 'жов', 'лис', 'гру',
]

const DAYS_OF_WEEK_FULL_UK = [
  'Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'Пʼятниця', 'Субота',
]

const DAYS_OF_WEEK_SHORT_UK = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

export function formatDayTitle(iso: string): { title: string; subtitle: string } {
  const d = new Date(`${iso}T12:00:00`)
  const dayOfWeek = DAYS_OF_WEEK_FULL_UK[d.getDay()]
  const dateFormatted = `${d.getDate()} ${MONTHS_GENITIVE_UK[d.getMonth()]}`
  const title = `${dayOfWeek}, ${dateFormatted}`

  const todayIso = toIsoDate(new Date())
  let subtitle = ''
  if (iso === todayIso) {
    subtitle = 'Сьогодні'
  } else if (iso === shiftDate(todayIso, 1)) {
    subtitle = 'Завтра'
  } else if (iso === shiftDate(todayIso, -1)) {
    subtitle = 'Вчора'
  } else {
    subtitle = `${d.getFullYear()} рік`
  }

  return { title, subtitle }
}

export function formatDateShort(iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  return `${DAYS_OF_WEEK_SHORT_UK[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT_UK[d.getMonth()]}`
}

export function timeToMinutes(time: string): number {
  const [hours, mins] = time.split(':').map(Number)
  return (hours || 0) * 60 + (mins || 0)
}

export function minutesToTime(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440
  const h = Math.floor(normalized / 60)
  const m = normalized % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function formatTimeRange(time: string, dur: number): string {
  const startMins = timeToMinutes(time)
  const endMins = startMins + dur
  return `${time} – ${minutesToTime(endMins)}`
}

/**
 * Проверка пересечения кандидатов на тренировку по времени.
 * Возвращает конфликтующую тренировку, если найдено пересечение.
 */
export function detectConflict(
  candidate: { date: string; time: string; dur: number },
  sessions: Session[],
  excludeSessionId?: string,
): Session | null {
  const candStart = timeToMinutes(candidate.time)
  const candEnd = candStart + candidate.dur

  return (
    sessions.find((s) => {
      if (s.id === excludeSessionId) return false
      if (s.status === 'cancelled') return false
      if (s.date !== candidate.date) return false

      const sStart = timeToMinutes(s.time)
      const sEnd = sStart + s.dur

      // Интервалы [candStart, candEnd) и [sStart, sEnd) пересекаются,
      // если candStart < sEnd && sStart < candEnd
      return candStart < sEnd && sStart < candEnd
    }) || null
  )
}

/**
 * Вычисляет строку «Найближче заняття» для клиента на основе актуальных тренировок
 */
export function findNextSession(clientId: string, sessions: Session[]): string | null {
  const now = new Date()
  const todayIso = toIsoDate(now)
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const futureSessions = sessions
    .filter((s) => {
      if (s.clientId !== clientId || s.status !== 'planned') return false
      if (s.date > todayIso) return true
      if (s.date === todayIso && timeToMinutes(s.time) >= currentMinutes) return true
      return false
    })
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return a.time.localeCompare(b.time)
    })

  if (futureSessions.length === 0) return null

  const next = futureSessions[0]
  return `${formatDateShort(next.date)} · ${next.time}`
}

export function isSessionPast(session: { date: string; time: string; dur: number }): boolean {
  const now = new Date()
  const todayIso = toIsoDate(now)
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const sessionStartMins = timeToMinutes(session.time)

  if (session.date < todayIso) return true
  if (session.date === todayIso && sessionStartMins + session.dur <= currentMinutes) return true
  return false
}

export function createInitialSessions(): Session[] {
  const today = toIsoDate(new Date())
  return [
    { id: 's101', clientId: 'c1', date: shiftDate(today, -1), time: '18:00', dur: 60, status: 'planned' },
    { id: 's102', clientId: 'c4', date: today, time: '08:00', dur: 60, status: 'planned' },
    { id: 's103', clientId: 'c3', date: today, time: '12:00', dur: 60, status: 'cancelled' },
    { id: 's104', clientId: 'c1', date: today, time: '18:00', dur: 60, status: 'planned' },
    { id: 's105', clientId: 'c2', date: shiftDate(today, 1), time: '07:30', dur: 60, status: 'planned' },
    { id: 's106', clientId: 'c3', date: shiftDate(today, 1), time: '19:00', dur: 60, status: 'planned' },
    { id: 's107', clientId: 'c4', date: shiftDate(today, 2), time: '08:00', dur: 60, status: 'planned' },
    { id: 's108', clientId: 'c5', date: shiftDate(today, 3), time: '17:30', dur: 90, status: 'planned' },
  ]
}

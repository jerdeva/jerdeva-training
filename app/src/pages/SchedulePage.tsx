import { useState } from 'react'
import type { Client, Session } from '../types'
import {
  toIsoDate,
  shiftDate,
  formatDayTitle,
  timeToMinutes,
} from '../data/sessions'
import { pluralUk } from '../data/plural'
import SessionForm from '../components/SessionForm'
import './SchedulePage.css'

type Props = {
  clients: Client[]
  sessions: Session[]
  onSaveSession: (values: {
    id?: string
    clientId: string
    date: string
    time: string
    dur: number
  }) => void
  onToggleStatus: (session: Session) => void
  onDeleteSession: (id: string) => void
  onNavigateToClients: () => void
}

export default function SchedulePage({
  clients,
  sessions,
  onSaveSession,
  onToggleStatus,
  onDeleteSession,
  onNavigateToClients,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<string>(() => toIsoDate(new Date()))
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null)

  const { title: dayTitle, subtitle: daySub } = formatDayTitle(selectedDate)

  // Тренировки на выбранный день, отсортированные по времени
  const daySessions = sessions
    .filter((s) => s.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time))

  const activeDayCount = daySessions.filter((s) => s.status === 'planned').length

  const now = new Date()
  const todayIso = toIsoDate(now)
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  function getClient(clientId: string) {
    return clients.find((c) => c.id === clientId)
  }

  function handleOpenNew() {
    setSessionToEdit(null)
    setIsFormOpen(true)
  }

  function handleOpenEdit(session: Session) {
    setSessionToEdit(session)
    setIsFormOpen(true)
  }

  function handleFormSave(values: {
    id?: string
    clientId: string
    date: string
    time: string
    dur: number
  }) {
    onSaveSession(values)
    setIsFormOpen(false)
    setSessionToEdit(null)
    // Переключаем календарь на дату созданного занятия
    setSelectedDate(values.date)
  }

  return (
    <div className="page">
      <header className="page__head">
        <div className="page__title">
          <h1>Розклад</h1>
          <span className="count-pill">
            {activeDayCount}{' '}
            {pluralUk(activeDayCount, ['тренування', 'тренування', 'тренувань'])}
          </span>
        </div>

        <button type="button" className="btn-primary" onClick={handleOpenNew}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Записати на тренування
        </button>
      </header>

      {/* Панель переключения дней */}
      <div className="day-bar" role="toolbar" aria-label="Вибір дня">
        <button
          type="button"
          className="day-bar__arrow"
          onClick={() => setSelectedDate((d) => shiftDate(d, -1))}
          aria-label="Попередній день"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="day-bar__center">
          <div className="day-bar__title">{dayTitle}</div>
          <div className="day-bar__sub">{daySub}</div>
        </div>

        <button
          type="button"
          className="day-bar__arrow"
          onClick={() => setSelectedDate((d) => shiftDate(d, 1))}
          aria-label="Наступний день"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        <button
          type="button"
          className="day-bar__today-btn"
          onClick={() => setSelectedDate(todayIso)}
        >
          Сьогодні
        </button>
      </div>

      {/* Список тренировок на этот день */}
      {daySessions.length > 0 ? (
        <ul className="sessions-list">
          {daySessions.map((session) => {
            const client = getClient(session.clientId)
            const isCancelled = session.status === 'cancelled'
            const sessionStartMin = timeToMinutes(session.time)
            const isPast =
              !isCancelled &&
              (session.date < todayIso ||
                (session.date === todayIso && sessionStartMin + session.dur < currentMinutes))

            let badgeClass = 'session-badge--planned'
            let badgeText = 'Заплановано'
            if (isCancelled) {
              badgeClass = 'session-badge--cancelled'
              badgeText = 'Скасовано'
            } else if (isPast) {
              badgeClass = 'session-badge--past'
              badgeText = 'Минуло'
            }

            return (
              <li key={session.id}>
                <button
                  type="button"
                  className={`session-card ${isCancelled ? 'session-card--cancelled' : ''}`}
                  onClick={() => handleOpenEdit(session)}
                  aria-label={`Тренування ${session.time}, клієнт ${client?.name || 'Клієнт'}`}
                >
                  <div className="session-time">
                    <div className="session-time__val">{session.time}</div>
                    <div className="session-time__dur">{session.dur} хв</div>
                  </div>

                  <div className="session-divider" aria-hidden="true" />

                  <div className="session-client">
                    <div className="session-client__name">
                      {client ? client.name : 'Клієнта видалено'}
                    </div>
                    <div className="session-client__contact">
                      {client?.contact || 'Контакт не вказано'}
                    </div>
                  </div>

                  <span className={`session-badge ${badgeClass}`}>
                    {badgeText}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="empty" style={{ margin: '20px var(--pad)' }}>
          <h2 className="empty__title">На цей день занять немає</h2>
          <p className="empty__text">
            Оберіть інший день або запишіть клієнта на тренування.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="btn-primary" style={{ flex: 'none' }} onClick={handleOpenNew}>
              Записати на тренування
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={onNavigateToClients}
            >
              Перейти до списку клієнтів
            </button>
          </div>
        </div>
      )}

      {isFormOpen && (
        <SessionForm
          clients={clients}
          sessions={sessions}
          initialDate={selectedDate}
          sessionToEdit={sessionToEdit}
          onSave={handleFormSave}
          onCancel={() => {
            setIsFormOpen(false)
            setSessionToEdit(null)
          }}
          onToggleStatus={(s) => {
            onToggleStatus(s)
            setIsFormOpen(false)
            setSessionToEdit(null)
          }}
          onDelete={(id) => {
            onDeleteSession(id)
            setIsFormOpen(false)
            setSessionToEdit(null)
          }}
        />
      )}
    </div>
  )
}

import { useEffect, useId, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import type { Client, Session } from '../types'
import { detectConflict, formatTimeRange } from '../data/sessions'
import './ClientForm.css'
import './SessionForm.css'

type Props = {
  clients: Client[]
  sessions: Session[]
  initialDate: string
  sessionToEdit?: Session | null
  onSave: (values: {
    id?: string
    clientId: string
    date: string
    time: string
    dur: number
  }) => void
  onCancel: () => void
  onToggleStatus?: (session: Session) => void
  onDelete?: (id: string) => void
}

const DURATIONS = [30, 45, 60, 90]

export default function SessionForm({
  clients,
  sessions,
  initialDate,
  sessionToEdit,
  onSave,
  onCancel,
  onToggleStatus,
  onDelete,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const clientSelectId = useId()
  const dateInputId = useId()
  const timeInputId = useId()

  const isEditing = !!sessionToEdit

  const [clientId, setClientId] = useState<string>(() => {
    if (sessionToEdit) return sessionToEdit.clientId
    const firstActive = clients.find((c) => c.status === 'active')
    return firstActive ? firstActive.id : clients[0]?.id || ''
  })

  const [date, setDate] = useState<string>(() => sessionToEdit?.date || initialDate)
  const [time, setTime] = useState<string>(() => sessionToEdit?.time || '09:00')
  const [dur, setDur] = useState<number>(() => sessionToEdit?.dur || 60)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()

    const handleCancel = (e: Event) => {
      e.preventDefault()
      onCancel()
    }

    dialog?.addEventListener('cancel', handleCancel)
    return () => dialog?.removeEventListener('cancel', handleCancel)
  }, [onCancel])

  // Проверка конфликта времени
  const conflictingSession = detectConflict(
    { date, time, dur },
    sessions,
    sessionToEdit?.id,
  )

  const conflictClient = conflictingSession
    ? clients.find((c) => c.id === conflictingSession.clientId)
    : null

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!clientId) {
      setError('Оберіть клієнта')
      return
    }

    if (!date) {
      setError('Оберіть дату тренування')
      return
    }

    if (!time) {
      setError('Вкажіть час тренування')
      return
    }

    onSave({
      id: sessionToEdit?.id,
      clientId,
      date,
      time,
      dur,
    })
  }

  return (
    <dialog ref={dialogRef} className="form-dialog" aria-labelledby="session-dialog-title">
      <form className="form-dialog__form" onSubmit={handleSubmit} noValidate>
        <header className="form-dialog__head">
          <h2 id="session-dialog-title" className="form-dialog__title">
            {isEditing ? 'Редагувати тренування' : 'Записати на тренування'}
          </h2>
          <button
            type="button"
            className="form-dialog__close"
            onClick={onCancel}
            aria-label="Закрити вікно"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="form-dialog__body">
          {error && <p className="field__error">{error}</p>}

          <div className="field">
            <label htmlFor={clientSelectId}>
              Клієнт <span className="field__required">*</span>
            </label>
            <select
              id={clientSelectId}
              className="field__select"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
            >
              {clients.length === 0 && <option value="">Немає клієнтів</option>}
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.sessionsLeft} занять залишилось)
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor={dateInputId}>
              Дата <span className="field__required">*</span>
            </label>
            <input
              id={dateInputId}
              type="date"
              className="field__input"
              value={date}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor={timeInputId}>
              Час початку <span className="field__required">*</span>
            </label>
            <input
              id={timeInputId}
              type="time"
              className="field__input"
              value={time}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTime(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Тривалість</label>
            <div className="duration-pills" role="radiogroup" aria-label="Тривалість тренування">
              {DURATIONS.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  className="duration-pill"
                  aria-pressed={dur === minutes}
                  onClick={() => setDur(minutes)}
                >
                  {minutes} хв
                </button>
              ))}
            </div>
          </div>

          {conflictingSession && (
            <div className="conflict-warning" role="alert">
              <svg className="conflict-warning__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>
                <strong>Увага: перетинається за часом</strong>
                <div>
                  У цей час вже заплановане заняття{' '}
                  {conflictClient ? `з «${conflictClient.name}»` : ''} ({formatTimeRange(conflictingSession.time, conflictingSession.dur)}).
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="form-dialog__foot">
          {isEditing && onToggleStatus && sessionToEdit && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onToggleStatus(sessionToEdit)}
            >
              {sessionToEdit.status === 'cancelled' ? 'Відновити' : 'Скасувати'}
            </button>
          )}

          {isEditing && onDelete && sessionToEdit && (
            <button
              type="button"
              className="client__delete"
              onClick={() => onDelete(sessionToEdit.id)}
            >
              Видалити
            </button>
          )}

          <button type="button" className="btn-secondary" onClick={onCancel}>
            Назад
          </button>
          <button type="submit" className="btn-primary">
            {isEditing ? 'Зберегти' : 'Запланувати'}
          </button>
        </footer>
      </form>
    </dialog>
  )
}

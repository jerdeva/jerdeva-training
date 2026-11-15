import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, Ref } from 'react'
import './ClientForm.css'

export type ClientFormValues = {
  name: string
  contact: string
  pricePerSession: number
  sessionsLeft: number
}

type FormState = { name: string; contact: string; price: string; sessions: string }
type Errors = Partial<Record<'name' | 'price' | 'sessions', string>>

type FieldProps = {
  id: string
  label: string
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  error?: string
  required?: boolean
  placeholder?: string
  inputMode?: 'text' | 'decimal' | 'numeric'
  inputRef?: Ref<HTMLInputElement>
}

function Field({ id, label, value, onChange, error, required, placeholder, inputMode, inputRef }: FieldProps) {
  const errorId = `${id}-error`
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required && <span className="field__required" aria-hidden="true"> *</span>}
      </label>
      <input
        id={id}
        ref={inputRef}
        className="field__input"
        type="text"
        inputMode={inputMode}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        aria-required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <p id={errorId} className="field__error">
          {error}
        </p>
      )}
    </div>
  )
}

type Props = {
  onSave: (values: ClientFormValues) => void
  onCancel: () => void
}

export default function ClientForm({ onSave, onCancel }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<FormState>({ name: '', contact: '', price: '', sessions: '' })
  const [errors, setErrors] = useState<Errors>({})

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    nameRef.current?.focus()
  }, [])

  const update = (key: keyof FormState) => (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const price = Number(form.price.replace(',', '.'))
    const nextErrors: Errors = {}

    if (!form.name.trim()) nextErrors.name = 'Вкажіть ім’я клієнта'
    if (form.price.trim() === '' || !Number.isFinite(price) || price <= 0) {
      nextErrors.price = 'Ціна має бути більшою за 0'
    }
    if (!/^\d+$/.test(form.sessions.trim())) {
      nextErrors.sessions = 'Вкажіть ціле число від 0'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    onSave({
      name: form.name.trim(),
      contact: form.contact.trim(),
      pricePerSession: price,
      sessionsLeft: Number(form.sessions.trim()),
    })
  }

  return (
    <dialog
      ref={dialogRef}
      className="form-dialog"
      aria-labelledby="client-form-title"
      onClose={onCancel}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
    >
      <form className="form-dialog__form" onSubmit={handleSubmit} noValidate>
        <div className="form-dialog__head">
          <h2 id="client-form-title" className="form-dialog__title">
            Новий клієнт
          </h2>
          <button type="button" className="form-dialog__close" aria-label="Закрити" onClick={onCancel}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="form-dialog__body">
          <Field
            id="client-name"
            label="Ім’я та прізвище"
            required
            value={form.name}
            onChange={update('name')}
            error={errors.name}
            placeholder="Наприклад, Олена Коваленко"
            inputRef={nameRef}
          />
          <Field
            id="client-contact"
            label="Контакт"
            value={form.contact}
            onChange={update('contact')}
            placeholder="Телефон або Telegram"
          />
          <Field
            id="client-price"
            label="Ціна заняття, ₴"
            required
            value={form.price}
            onChange={update('price')}
            error={errors.price}
            placeholder="700"
            inputMode="decimal"
          />
          <Field
            id="client-sessions"
            label="Оплачено тренувань"
            required
            value={form.sessions}
            onChange={update('sessions')}
            error={errors.sessions}
            placeholder="8"
            inputMode="numeric"
          />
        </div>

        <div className="form-dialog__foot">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Скасувати
          </button>
          <button type="submit" className="btn-primary">
            Зберегти
          </button>
        </div>
      </form>
    </dialog>
  )
}
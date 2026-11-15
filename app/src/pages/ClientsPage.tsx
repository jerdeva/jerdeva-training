import { useState, useEffect, useCallback } from 'react'
import ClientForm from '../components/ClientForm'
import type { ClientFormValues } from '../components/ClientForm'
import { clients as initialClients } from '../data/clients'
import { pluralUk } from '../data/plural'
import type { Client } from '../types'
import './ClientsPage.css'
import {
  supabase,
  fromDbClient,
  toDbClient,
  type DatabaseClient,
} from '../lib/supabase'

const LOW_BALANCE_LIMIT = 2
const CLIENTS_STORAGE_KEY = 'trainer-desk-clients-v1'

type StatusFilter = 'all' | 'active' | 'inactive'

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Усі' },
  { value: 'active', label: 'Активні' },
  { value: 'inactive', label: 'Неактивні' },
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function ClientRow({
  client,
  onDelete,
}: {
  client: Client
  onDelete: (client: Client) => void
}) {
  const isLow = client.sessionsLeft <= LOW_BALANCE_LIMIT
  const sessionsWord = pluralUk(client.sessionsLeft, ['заняття', 'заняття', 'занять'])

  return (
    <li className="client">
      <div className="client__who">
        <span className="client__avatar" aria-hidden="true">
          {getInitials(client.name)}
        </span>
        <div className="client__who-text">
          <div className="client__name">
            {client.name}
            {client.status === 'inactive' && <span className="tag">Неактивний</span>}
          </div>
          <div className="client__contact">{client.contact || 'Контакт не вказано'}</div>
          <button
            type="button"
            className="client__delete"
            onClick={() => onDelete(client)}
            aria-label={`Видалити клієнта ${client.name}`}
          >
            Видалити
          </button>
        </div>
      </div>

      <div className="client__cell client__cell--price">
        <span className="client__label">Ціна заняття</span>
        <span className="client__value">{client.pricePerSession} ₴</span>
      </div>

      <div className="client__cell client__cell--left">
        <span className="client__label">Залишок</span>
        <span className="client__balance">
          <span className="client__value client__value--strong">
            {client.sessionsLeft} {sessionsWord}
          </span>
          {isLow && (
            <span className="badge-warning">
              {client.sessionsLeft === 0 ? 'Немає занять' : 'Залишилось мало'}
            </span>
          )}
        </span>
      </div>

      <div className="client__cell client__cell--next">
        <span className="client__label">Найближче заняття</span>
        <span
          className={client.nextSessionLabel ? 'client__value' : 'client__value client__value--muted'}
        >
          {client.nextSessionLabel ?? 'Не заплановано'}
        </span>
      </div>
    </li>
  )
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem(CLIENTS_STORAGE_KEY)
      if (saved) {
        const parsed: unknown = JSON.parse(saved)
        if (Array.isArray(parsed)) return parsed as Client[]
      }
    } catch {
      // Игнорируем ошибку чтения кэша
    }
    return initialClients
  })

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('all')

  const loadClients = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Помилка завантаження з Supabase:', error)
        return
      }

      if (data && data.length > 0) {
        const mapped = (data as DatabaseClient[]).map(fromDbClient)
        setClients(mapped)
        localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(mapped))
      }
    } catch (err) {
      console.error('Не вдалося зʼєднатися з базою:', err)
    }
  }, [])

  useEffect(() => {
    loadClients()

    // Слушаем изменения в базе в реальном времени
    const channel = supabase
      .channel('realtime-clients')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        () => {
          loadClients()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadClients])

  const total = clients.length
  const normalizedQuery = query.trim().toLowerCase()
  const visible = clients.filter(
    (client) =>
      (filter === 'all' || client.status === filter) &&
      client.name.toLowerCase().includes(normalizedQuery),
  )

  function resetFilters() {
    setQuery('')
    setFilter('all')
  }

  async function addClient(values: ClientFormValues) {
    const newClient: Client = {
      id: crypto.randomUUID(),
      ...values,
      nextSessionLabel: null,
      status: 'active',
    }

    // Мгновенно отображаем в интерфейсе
    setClients((current) => [newClient, ...current])
    resetFilters()
    setIsFormOpen(false)

    try {
      const { error } = await supabase
        .from('clients')
        .insert(toDbClient(newClient))

      if (error) {
        console.error('Помилка додавання в Supabase:', error)
        alert('Не вдалося зберегти в базу: ' + error.message)
        loadClients()
      } else {
        setClients((current) => {
          localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(current))
          return current
        })
      }
    } catch (err) {
      console.error('Помилка запиту:', err)
    }
  }

  async function deleteClient(clientToDelete: Client) {
    const confirmed = window.confirm(
      `Видалити клієнта «${clientToDelete.name}»?`,
    )
    if (!confirmed) return

    setClients((current) =>
      current.filter((client) => client.id !== clientToDelete.id),
    )

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientToDelete.id)

      if (error) {
        console.error('Помилка видалення в Supabase:', error)
        alert('Не вдалося видалити з бази: ' + error.message)
        loadClients()
      } else {
        setClients((current) => {
          localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(current))
          return current
        })
      }
    } catch (err) {
      console.error('Помилка запиту:', err)
    }
  }

  return (
    <div className="page">
      <header className="page__head">
        <div className="page__title">
          <h1>Клієнти</h1>
          <span className="count-pill">
            {total} {pluralUk(total, ['клієнт', 'клієнти', 'клієнтів'])}
          </span>
        </div>
        <button type="button" className="btn-primary" onClick={() => setIsFormOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Додати клієнта
        </button>
      </header>

      <div className="controls">
        <label className="search">
          <span className="visually-hidden">Пошук за іменем</span>
          <svg className="search__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            className="search__input"
            type="search"
            placeholder="Пошук за іменем"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <div className="segmented" role="group" aria-label="Фільтр за статусом">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              className="segmented__btn"
              aria-pressed={filter === item.value}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length > 0 ? (
        <>
          <div className="clients-head" aria-hidden="true">
            <div>Клієнт</div>
            <div>Ціна заняття</div>
            <div>Залишок</div>
            <div>Найближче заняття</div>
          </div>

          <ul className="clients">
            {visible.map((client) => (
              <ClientRow
                key={client.id}
                client={client}
                onDelete={deleteClient}
              />
            ))}
          </ul>
        </>
      ) : (
        <div className="empty">
          <h2 className="empty__title">Нічого не знайдено</h2>
          <p className="empty__text">Змініть запит або фільтр.</p>
          <button type="button" className="btn-secondary" onClick={resetFilters}>
            Скинути пошук і фільтр
          </button>
        </div>
      )}

      <p className="clients-foot">
        Показано {visible.length} з {total}
      </p>

      {isFormOpen && <ClientForm onSave={addClient} onCancel={() => setIsFormOpen(false)} />}
    </div>
  )
}

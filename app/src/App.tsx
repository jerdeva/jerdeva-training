import { useState, useEffect, useCallback, useMemo } from 'react'
import AppShell from './components/AppShell'
import type { NavId } from './components/AppShell'
import ClientsPage from './pages/ClientsPage'
import SchedulePage from './pages/SchedulePage'
import type { ClientFormValues } from './components/ClientForm'
import type { Client, Session, SessionStatus } from './types'
import { clients as initialClients } from './data/clients'
import { createInitialSessions, findNextSession } from './data/sessions'
import {
  supabase,
  fromDbClient,
  toDbClient,
  fromDbSession,
  toDbSession,
  type DatabaseClient,
  type DatabaseSession,
} from './lib/supabase'

const CLIENTS_STORAGE_KEY = 'trainer-desk-clients-v1'
const SESSIONS_STORAGE_KEY = 'trainer-desk-sessions-v1'

export default function App() {
  const [activeTab, setActiveTab] = useState<NavId>('clients')

  // 1. Клиенты
  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem(CLIENTS_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) return parsed as Client[]
      }
    } catch {
      // ignore
    }
    return initialClients
  })

  // 2. Тренировки (Сессии)
  const [sessions, setSessions] = useState<Session[]>(() => {
    try {
      const saved = localStorage.getItem(SESSIONS_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) return parsed as Session[]
      }
    } catch {
      // ignore
    }
    return createInitialSessions()
  })

  // Загрузка клиентов из Supabase
  const loadClients = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Помилка завантаження клієнтів:', error)
        return
      }

      if (data && data.length > 0) {
        const mapped = (data as DatabaseClient[]).map(fromDbClient)
        setClients(mapped)
        localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(mapped))
      }
    } catch (err) {
      console.error('Не вдалося завантажити клієнтів:', err)
    }
  }, [])

  // Загрузка занятий из Supabase
  const loadSessions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('date', { ascending: true })

      if (error) {
        // Если таблицы еще нет в Supabase, остаемся на локальных данных
        console.warn('Заняття завантажено з локального стану (таблиця в Supabase ще створюється):', error.message)
        return
      }

      if (data && data.length > 0) {
        const mapped = (data as DatabaseSession[]).map(fromDbSession)
        setSessions(mapped)
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(mapped))
      }
    } catch (err) {
      console.error('Не вдалося завантажити заняття:', err)
    }
  }, [])

  useEffect(() => {
    loadClients()
    loadSessions()

    // Realtime для клиентов
    const clientsChannel = supabase
      .channel('realtime-clients')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        () => {
          loadClients()
        },
      )
      .subscribe()

    // Realtime для занятий
    const sessionsChannel = supabase
      .channel('realtime-sessions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions' },
        () => {
          loadSessions()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(clientsChannel)
      supabase.removeChannel(sessionsChannel)
    }
  }, [loadClients, loadSessions])

  // Динамически вычисляем ближайшее занятие для каждого клиента
  const clientsWithComputedNext = useMemo(() => {
    return clients.map((c) => {
      const computedNext = findNextSession(c.id, sessions)
      return {
        ...c,
        nextSessionLabel: computedNext ?? c.nextSessionLabel,
      }
    })
  }, [clients, sessions])

  // Добавление клиента
  async function handleAddClient(values: ClientFormValues) {
    const newClient: Client = {
      id: crypto.randomUUID(),
      ...values,
      nextSessionLabel: null,
      status: 'active',
    }

    setClients((curr) => {
      const next = [newClient, ...curr]
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(next))
      return next
    })

    try {
      const { error } = await supabase.from('clients').insert(toDbClient(newClient))
      if (error) {
        console.error('Помилка додавання клієнта:', error)
      }
    } catch (err) {
      console.error('Помилка Supabase:', err)
    }
  }

  // Удаление клиента
  async function handleDeleteClient(client: Client) {
    const confirmed = window.confirm(`Видалити клієнта «${client.name}»?`)
    if (!confirmed) return

    setClients((curr) => {
      const next = curr.filter((c) => c.id !== client.id)
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(next))
      return next
    })

    try {
      const { error } = await supabase.from('clients').delete().eq('id', client.id)
      if (error) {
        console.error('Помилка видалення клієнта:', error)
      }
    } catch (err) {
      console.error('Помилка Supabase:', err)
    }
  }

  // Создание или редактирование занятия
  async function handleSaveSession(values: {
    id?: string
    clientId: string
    date: string
    time: string
    dur: number
  }) {
    if (values.id) {
      // Редактирование существующего
      const sessionId = values.id
      setSessions((curr) => {
        const next = curr.map((s) =>
          s.id === sessionId
            ? { ...s, clientId: values.clientId, date: values.date, time: values.time, dur: values.dur }
            : s,
        )
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(next))
        return next
      })

      try {
        const { error } = await supabase
          .from('sessions')
          .update(toDbSession(values))
          .eq('id', sessionId)
        if (error) console.error('Помилка оновлення тренування в базі:', error)
      } catch (err) {
        console.error('Помилка Supabase:', err)
      }
    } else {
      // Создание нового
      const newSession: Session = {
        id: crypto.randomUUID(),
        clientId: values.clientId,
        date: values.date,
        time: values.time,
        dur: values.dur,
        status: 'planned',
      }

      setSessions((curr) => {
        const next = [...curr, newSession]
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(next))
        return next
      })

      try {
        const { error } = await supabase
          .from('sessions')
          .insert(toDbSession(newSession))
        if (error) console.error('Помилка збереження тренування в базі:', error)
      } catch (err) {
        console.error('Помилка Supabase:', err)
      }
    }
  }

  // Изменение статуса занятия (скасувати / відновити)
  async function handleToggleSessionStatus(session: Session) {
    const nextStatus: SessionStatus =
      session.status === 'cancelled' ? 'planned' : 'cancelled'
    setSessions((curr) => {
      const next = curr.map((s) => (s.id === session.id ? { ...s, status: nextStatus } : s))
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(next))
      return next
    })

    try {
      const { error } = await supabase
        .from('sessions')
        .update({ status: nextStatus })
        .eq('id', session.id)
      if (error) console.error('Помилка оновлення статусу в базі:', error)
    } catch (err) {
      console.error('Помилка Supabase:', err)
    }
  }

  // Удаление занятия
  async function handleDeleteSession(id: string) {
    const confirmed = window.confirm('Видалити це тренування з розкладу?')
    if (!confirmed) return

    setSessions((curr) => {
      const next = curr.filter((s) => s.id !== id)
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(next))
      return next
    })

    try {
      const { error } = await supabase.from('sessions').delete().eq('id', id)
      if (error) console.error('Помилка видалення заняття в базі:', error)
    } catch (err) {
      console.error('Помилка Supabase:', err)
    }
  }

  return (
    <AppShell
      active={activeTab}
      onSelect={(id) => {
        if (id === 'clients' || id === 'schedule') {
          setActiveTab(id)
        }
      }}
    >
      {activeTab === 'clients' ? (
        <ClientsPage
          clients={clientsWithComputedNext}
          onAddClient={handleAddClient}
          onDeleteClient={handleDeleteClient}
          onNavigateToSchedule={() => setActiveTab('schedule')}
        />
      ) : (
        <SchedulePage
          clients={clients}
          sessions={sessions}
          onSaveSession={handleSaveSession}
          onToggleStatus={handleToggleSessionStatus}
          onDeleteSession={handleDeleteSession}
          onNavigateToClients={() => setActiveTab('clients')}
        />
      )}
    </AppShell>
  )
}

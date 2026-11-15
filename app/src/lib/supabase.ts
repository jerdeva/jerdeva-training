import { createClient } from '@supabase/supabase-js'
import type { Client, Session, SessionStatus } from '../types'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://vsrwzkortlocxrzzhwsa.supabase.co'
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_9evD1VfrKFSaSCS1KG79PA_vwO3zVZN'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type DatabaseClient = {
  id: string
  name: string
  contact: string
  price_per_session: number
  sessions_left: number
  next_session_label: string | null
  status: 'active' | 'inactive'
  created_at?: string
}

export function fromDbClient(db: DatabaseClient): Client {
  return {
    id: db.id,
    name: db.name,
    contact: db.contact ?? '',
    pricePerSession: Number(db.price_per_session ?? 0),
    sessionsLeft: Number(db.sessions_left ?? 0),
    nextSessionLabel: db.next_session_label ?? null,
    status: (db.status as 'active' | 'inactive') || 'active',
  }
}

export function toDbClient(client: Partial<Client>) {
  const row: Record<string, unknown> = {}
  if (client.id !== undefined) row.id = client.id
  if (client.name !== undefined) row.name = client.name
  if (client.contact !== undefined) row.contact = client.contact
  if (client.pricePerSession !== undefined) row.price_per_session = client.pricePerSession
  if (client.sessionsLeft !== undefined) row.sessions_left = client.sessionsLeft
  if (client.nextSessionLabel !== undefined) row.next_session_label = client.nextSessionLabel
  if (client.status !== undefined) row.status = client.status
  return row
}

export type DatabaseSession = {
  id: string
  client_id: string
  date: string
  time: string
  dur: number
  status: SessionStatus
  is_deducted?: boolean
  created_at?: string
}

export function fromDbSession(db: DatabaseSession): Session {
  return {
    id: db.id,
    clientId: db.client_id,
    date: db.date,
    time: db.time,
    dur: Number(db.dur ?? 60),
    status: db.status || 'planned',
    isDeducted: Boolean(db.is_deducted),
  }
}

export function toDbSession(session: Partial<Session>) {
  const row: Record<string, unknown> = {}
  if (session.id !== undefined) row.id = session.id
  if (session.clientId !== undefined) row.client_id = session.clientId
  if (session.date !== undefined) row.date = session.date
  if (session.time !== undefined) row.time = session.time
  if (session.dur !== undefined) row.dur = session.dur
  if (session.status !== undefined) row.status = session.status
  if (session.isDeducted !== undefined) row.is_deducted = session.isDeducted
  return row
}

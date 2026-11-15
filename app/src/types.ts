export type ClientStatus = 'active' | 'inactive'

export type Client = {
  id: string
  name: string
  contact: string
  pricePerSession: number // ₴
  sessionsLeft: number
  nextSessionLabel: string | null
  status: ClientStatus
}

export type SessionStatus = 'planned' | 'cancelled' | 'completed'

export type Session = {
  id: string
  clientId: string
  date: string // YYYY-MM-DD
  time: string // HH:MM
  dur: number // minutes, e.g. 60
  status: SessionStatus
  isDeducted?: boolean
}

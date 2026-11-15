export type ClientStatus = 'active' | 'inactive'

export type Client = {
  id: string
  name: string
  contact: string
  pricePerSession: number // ₴
  sessionsLeft: number
  // Пока готовый текст для демо. Когда появится расписание,
  // это поле будет вычисляться из занятий.
  nextSessionLabel: string | null
  status: ClientStatus
}
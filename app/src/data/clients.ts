import type { Client } from '../types'

export const clients: Client[] = [
  { id: 'c1', name: 'Олена Коваленко', contact: '+380 67 214 38 52', pricePerSession: 700, sessionsLeft: 8, nextSessionLabel: 'Пн, 16 лис · 18:00', status: 'active' },
  { id: 'c2', name: 'Максим Бондаренко', contact: '@max_bondar', pricePerSession: 650, sessionsLeft: 2, nextSessionLabel: 'Вт, 17 лис · 07:30', status: 'active' },
  { id: 'c3', name: 'Ірина Шевченко', contact: '+380 50 771 09 26', pricePerSession: 800, sessionsLeft: 1, nextSessionLabel: 'Вт, 17 лис · 19:00', status: 'active' },
  { id: 'c4', name: 'Андрій Мельник', contact: 'andrii.melnyk@mail.ua', pricePerSession: 600, sessionsLeft: 12, nextSessionLabel: 'Ср, 18 лис · 08:00', status: 'active' },
  { id: 'c5', name: 'Софія Ткачук', contact: '+380 93 480 15 67', pricePerSession: 750, sessionsLeft: 5, nextSessionLabel: 'Чт, 19 лис · 17:30', status: 'active' },
  { id: 'c6', name: 'Дмитро Кравчук', contact: '@dkravchuk', pricePerSession: 600, sessionsLeft: 0, nextSessionLabel: null, status: 'inactive' },
]
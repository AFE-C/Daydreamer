import Dexie, { type Table } from 'dexie'
import type { Entry } from '../types/entry'

export type AppSetting = {
  key: string
  value: string
}

export class DaydreamerDatabase extends Dexie {
  entries!: Table<Entry, string>
  settings!: Table<AppSetting, string>

  constructor() {
    super('daydreamer-db')
    this.version(1).stores({
      entries: 'id, createdAt, updatedAt, isFavorite, *tags',
      settings: 'key',
    })
  }
}

export const db = new DaydreamerDatabase()

import Dexie, { type Table } from 'dexie'
import type { Entry } from '../types/entry'

export type AppSetting = {
  key: string
  value: string
}

export type SyncOperation = {
  operationId: string
  ownerId: string
  entryId: string
  kind: 'upsert' | 'delete'
  entry?: Entry
  updatedAt: string
  createdAt: string
}

export type SyncMeta = {
  ownerId: string
  lastSyncedAt?: string
  state: 'idle' | 'syncing' | 'synced' | 'offline' | 'error'
  message?: string
}

export class DaydreamerDatabase extends Dexie {
  entries!: Table<Entry, string>
  settings!: Table<AppSetting, string>
  syncQueue!: Table<SyncOperation, string>
  syncMeta!: Table<SyncMeta, string>

  constructor() {
    super('daydreamer-db')
    this.version(1).stores({
      entries: 'id, createdAt, updatedAt, isFavorite, *tags',
      settings: 'key',
    })
    this.version(2).stores({
      entries: 'id, ownerId, [ownerId+createdAt], [ownerId+updatedAt], isFavorite, *tags',
      settings: 'key',
      syncQueue: 'operationId, ownerId, [ownerId+entryId], entryId, updatedAt',
      syncMeta: 'ownerId',
    })
  }
}

export const db = new DaydreamerDatabase()

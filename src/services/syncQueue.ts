import { db, type SyncOperation } from '../db/daydreamerDb'
import type { Entry } from '../types/entry'

function createOperationId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export async function queueUpsert(entry: Entry) {
  if (!entry.ownerId) return
  const operation: SyncOperation = {
    operationId: createOperationId(),
    ownerId: entry.ownerId,
    entryId: entry.id,
    kind: 'upsert',
    entry,
    updatedAt: entry.updatedAt,
    createdAt: new Date().toISOString(),
  }
  await db.syncQueue.add(operation)
}

export async function queueDelete(ownerId: string, entryId: string, updatedAt = new Date().toISOString()) {
  await db.syncQueue.add({
    operationId: createOperationId(),
    ownerId,
    entryId,
    kind: 'delete',
    updatedAt,
    createdAt: new Date().toISOString(),
  })
}

export async function claimLegacyEntries(ownerId: string) {
  const legacy = await db.entries.filter((entry) => !entry.ownerId).toArray()
  if (!legacy.length) return 0
  await db.transaction('rw', db.entries, async () => {
    await Promise.all(legacy.map((entry) => db.entries.put({ ...entry, ownerId })))
  })
  await Promise.all(legacy.map((entry) => queueUpsert({ ...entry, ownerId })))
  return legacy.length
}

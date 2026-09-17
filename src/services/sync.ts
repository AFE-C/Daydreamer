import { DATA_CHANGED_EVENT, SYNC_STATUS_EVENT } from '../app/events'
import { db, type SyncMeta, type SyncOperation } from '../db/daydreamerDb'
import { supabase } from '../lib/supabase'
import type { Entry } from '../types/entry'
import { queueUpsert } from './syncQueue'

type RemoteEntry = {
  id: string
  user_id: string
  title: string
  content_json: Entry['contentJson']
  content_text: string
  tags: string[]
  mood: Entry['mood'] | null
  color: Entry['color']
  is_favorite: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

function toRemote(entry: Entry, ownerId: string): RemoteEntry {
  return {
    id: entry.id,
    user_id: ownerId,
    title: entry.title,
    content_json: entry.contentJson,
    content_text: entry.contentText,
    tags: entry.tags,
    mood: entry.mood ?? null,
    color: entry.color,
    is_favorite: entry.isFavorite,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
    deleted_at: null,
  }
}

function fromRemote(row: RemoteEntry): Entry {
  return {
    id: row.id,
    ownerId: row.user_id,
    title: row.title,
    contentJson: row.content_json,
    contentText: row.content_text,
    tags: row.tags ?? [],
    ...(row.mood ? { mood: row.mood } : {}),
    color: row.color,
    isFavorite: row.is_favorite,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function setSyncMeta(ownerId: string, patch: Partial<SyncMeta>) {
  try {
    const current = await db.syncMeta.get(ownerId)
    await db.syncMeta.put({ ownerId, state: 'idle', ...current, ...patch })
    window.dispatchEvent(new Event(SYNC_STATUS_EVENT))
  } catch {
    // Sync metadata is only a status aid. If IndexedDB is unavailable, the
    // record editor must remain usable and the failure must stay handled.
  }
}

async function getRemoteEntries(ownerId: string) {
  if (!supabase) throw new Error('Supabase 尚未配置')
  const { data, error } = await supabase.from('entries').select('*').eq('user_id', ownerId)
  if (error) throw error
  return (data ?? []) as RemoteEntry[]
}

async function pushOperation(ownerId: string, operation: SyncOperation) {
  if (!supabase) throw new Error('Supabase 尚未配置')
  if (operation.kind === 'upsert' && operation.entry) {
    const { error } = await supabase.from('entries').upsert(toRemote(operation.entry, ownerId), { onConflict: 'id' })
    if (error) throw error
    return
  }

  const { error } = await supabase
    .from('entries')
    .update({ deleted_at: operation.updatedAt, updated_at: operation.updatedAt })
    .eq('id', operation.entryId)
    .eq('user_id', ownerId)
  if (error) throw error
}

async function pushQueue(ownerId: string) {
  const operations = await db.syncQueue.where('ownerId').equals(ownerId).sortBy('updatedAt')
  for (const operation of operations) {
    await pushOperation(ownerId, operation)
    await db.syncQueue.delete(operation.operationId)
  }
}

async function pullEntries(ownerId: string) {
  const remoteEntries = await getRemoteEntries(ownerId)
  const localEntries = new Map((await db.entries.where('ownerId').equals(ownerId).toArray()).map((entry) => [entry.id, entry]))
  let changed = false

  for (const remote of remoteEntries) {
    const local = localEntries.get(remote.id)
    if (remote.deleted_at) {
      if (!local || remote.updated_at >= local.updatedAt) {
        if (local) {
          await db.entries.delete(remote.id)
          changed = true
        }
        await db.syncQueue.where('[ownerId+entryId]').equals([ownerId, remote.id]).delete()
      } else {
        await queueUpsert(local)
      }
      continue
    }

    const remoteEntry = fromRemote(remote)
    if (!local || remote.updated_at > local.updatedAt) {
      await db.entries.put(remoteEntry)
      changed = true
    } else if (local.updatedAt > remote.updated_at) {
      await queueUpsert(local)
    }
  }

  if (changed) window.dispatchEvent(new Event(DATA_CHANGED_EVENT))
}

export async function syncUser(ownerId: string) {
  if (!supabase) {
    await setSyncMeta(ownerId, { state: 'error', message: '云同步尚未配置' })
    return { state: 'error' as const, message: '云同步尚未配置' }
  }
  if (!navigator.onLine) {
    await setSyncMeta(ownerId, { state: 'offline', message: '当前离线，记录会在联网后同步' })
    return { state: 'offline' as const, message: '当前离线，记录会在联网后同步' }
  }

  await setSyncMeta(ownerId, { state: 'syncing', message: undefined })
  try {
    await pushQueue(ownerId)
    await pullEntries(ownerId)
    const syncedAt = new Date().toISOString()
    await setSyncMeta(ownerId, { state: 'synced', lastSyncedAt: syncedAt, message: undefined })
    return { state: 'synced' as const, syncedAt }
  } catch (error) {
    const message = error instanceof Error ? error.message : '同步失败'
    await setSyncMeta(ownerId, { state: 'error', message: '云端暂时不可用，记录仍保存在本机' })
    return { state: 'error' as const, message }
  }
}

export function createSyncController(ownerId: string) {
  let timer: number | undefined
  let running = false

  const run = async () => {
    if (running) return
    running = true
    try {
      await syncUser(ownerId)
    } finally {
      running = false
    }
  }

  const schedule = () => {
    window.clearTimeout(timer)
    timer = window.setTimeout(() => void run(), 180)
  }

  window.addEventListener('online', schedule)
  window.addEventListener(DATA_CHANGED_EVENT, schedule)
  document.addEventListener('visibilitychange', schedule)
  void run()

  return () => {
    window.clearTimeout(timer)
    window.removeEventListener('online', schedule)
    window.removeEventListener(DATA_CHANGED_EVENT, schedule)
    document.removeEventListener('visibilitychange', schedule)
  }
}

import { allEntries, updateEntry } from './entries'
import { db } from '../db/daydreamerDb'
import { ENTRY_COLORS, MOODS, type DaydreamerBackup, type Entry, type ImportResult } from '../types/entry'

export async function exportBackup(): Promise<DaydreamerBackup> {
  const entries = await allEntries()
  return {
    app: 'Daydreamer',
    version: 1,
    exportedAt: new Date().toISOString(),
    entries: entries.sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  }
}

function isValidEntry(value: unknown): value is Entry {
  if (!value || typeof value !== 'object') return false
  const entry = value as Partial<Entry>
  return Boolean(
    typeof entry.id === 'string' &&
      typeof entry.title === 'string' &&
      typeof entry.contentText === 'string' &&
      entry.contentJson &&
      typeof entry.contentJson === 'object' &&
      Array.isArray(entry.tags) &&
      typeof entry.color === 'string' &&
      ENTRY_COLORS.includes(entry.color as (typeof ENTRY_COLORS)[number]) &&
      (entry.mood === undefined || (typeof entry.mood === 'string' && MOODS.includes(entry.mood as (typeof MOODS)[number]))) &&
      typeof entry.isFavorite === 'boolean' &&
      typeof entry.createdAt === 'string' &&
      typeof entry.updatedAt === 'string',
  )
}

export function parseBackup(input: unknown): DaydreamerBackup {
  if (!input || typeof input !== 'object') throw new Error('备份文件格式不正确')
  const backup = input as Partial<DaydreamerBackup>
  if (backup.app !== 'Daydreamer' || backup.version !== 1 || !Array.isArray(backup.entries)) {
    throw new Error('这不是兼容的 Daydreamer 备份文件')
  }
  if (!backup.entries.every(isValidEntry)) throw new Error('备份中包含无法识别的记录')
  return {
    app: 'Daydreamer',
    version: 1,
    exportedAt: typeof backup.exportedAt === 'string' ? backup.exportedAt : new Date().toISOString(),
    entries: backup.entries,
  }
}

export async function importBackup(input: unknown): Promise<ImportResult> {
  const backup = parseBackup(input)
  const result: ImportResult = { inserted: 0, updated: 0, skipped: 0 }
  const existing = new Map((await db.entries.toArray()).map((entry) => [entry.id, entry]))

  for (const incoming of backup.entries) {
    const current = existing.get(incoming.id)
    if (!current) {
      await db.entries.add(incoming)
      result.inserted += 1
      continue
    }
    if (incoming.updatedAt > current.updatedAt) {
      await updateEntry(incoming.id, incoming)
      result.updated += 1
    } else {
      result.skipped += 1
    }
  }
  return result
}

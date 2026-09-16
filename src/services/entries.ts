import { db } from '../db/daydreamerDb'
import type { Entry, EntryFilters, EntryInput } from '../types/entry'

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizeTags(tags: string[]) {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))].slice(0, 12)
}

export function extractText(content: unknown): string {
  if (!content || typeof content !== 'object') return ''
  const node = content as { text?: unknown; content?: unknown[] }
  const ownText = typeof node.text === 'string' ? node.text : ''
  const children = Array.isArray(node.content) ? node.content.map(extractText).join(' ') : ''
  return `${ownText} ${children}`.replace(/\s+/g, ' ').trim()
}

export async function createEntry(input: EntryInput): Promise<Entry> {
  const now = new Date().toISOString()
  const entry: Entry = {
    ...input,
    id: createId(),
    tags: normalizeTags(input.tags),
    createdAt: now,
    updatedAt: now,
  }
  await db.entries.add(entry)
  return entry
}

export async function updateEntry(id: string, patch: Partial<EntryInput>): Promise<Entry> {
  const current = await db.entries.get(id)
  if (!current) throw new Error('找不到这条记录')
  const next: Entry = {
    ...current,
    ...patch,
    tags: patch.tags ? normalizeTags(patch.tags) : current.tags,
    updatedAt: new Date().toISOString(),
  }
  await db.entries.put(next)
  return next
}

export async function getEntry(id: string) {
  return db.entries.get(id)
}

export async function listEntries(filters: EntryFilters = {}) {
  const all = await db.entries.toArray()
  const search = filters.search?.trim().toLocaleLowerCase()
  return all
    .filter((entry) => {
      if (filters.favoritesOnly && !entry.isFavorite) return false
      if (filters.tag && !entry.tags.includes(filters.tag)) return false
      if (!search) return true
      return [entry.title, entry.contentText, ...entry.tags].some((value) => value.toLocaleLowerCase().includes(search))
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function deleteEntry(id: string) {
  await db.entries.delete(id)
}

export async function allEntries() {
  return db.entries.toArray()
}

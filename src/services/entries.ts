import { db } from '../db/daydreamerDb'
import type { Entry, EntryFilters, EntryInput } from '../types/entry'
import { queueDelete, queueUpsert } from './syncQueue'

export type ReviewDateBounds = {
  earliestDateKey: string
  latestDateKey: string
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizeTags(tags: string[]) {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))].slice(0, 12)
}

export function toLocalDateKey(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function toLocalMonthKey(value: Date | string): string {
  return toLocalDateKey(value).slice(0, 7)
}

export function getEntryCreatedDateKey(entry: Pick<Entry, 'createdAt'>) {
  return toLocalDateKey(entry.createdAt)
}

export function getReviewDateBounds(entries: Pick<Entry, 'createdAt'>[]): ReviewDateBounds | null {
  const dateKeys = entries.map(getEntryCreatedDateKey).filter(Boolean).sort()
  if (dateKeys.length === 0) return null
  return {
    earliestDateKey: dateKeys[0],
    latestDateKey: dateKeys[dateKeys.length - 1],
  }
}

export function isEntryOnThisDay(entry: Pick<Entry, 'createdAt'>, referenceDate = new Date()) {
  const createdAt = new Date(entry.createdAt)
  return !Number.isNaN(createdAt.getTime())
    && createdAt.getMonth() === referenceDate.getMonth()
    && createdAt.getDate() === referenceDate.getDate()
    && createdAt.getFullYear() < referenceDate.getFullYear()
}

export function extractText(content: unknown): string {
  if (!content || typeof content !== 'object') return ''
  const node = content as { text?: unknown; content?: unknown[] }
  const ownText = typeof node.text === 'string' ? node.text : ''
  const children = Array.isArray(node.content) ? node.content.map(extractText).join(' ') : ''
  return `${ownText} ${children}`.replace(/\s+/g, ' ').trim()
}

export async function createEntry(ownerId: string, input: EntryInput): Promise<Entry> {
  const now = new Date().toISOString()
  const entry: Entry = {
    ...input,
    ownerId,
    id: createId(),
    tags: normalizeTags(input.tags),
    createdAt: now,
    updatedAt: now,
  }
  await db.entries.add(entry)
  await queueUpsert(entry)
  return entry
}

export async function updateEntry(ownerId: string, id: string, patch: Partial<EntryInput>): Promise<Entry> {
  const current = await db.entries.get(id)
  if (!current || current.ownerId !== ownerId) throw new Error('找不到这条记录')
  const next: Entry = {
    ...current,
    ...patch,
    tags: patch.tags ? normalizeTags(patch.tags) : current.tags,
    updatedAt: new Date().toISOString(),
  }
  await db.entries.put(next)
  await queueUpsert(next)
  return next
}

export async function getEntry(ownerId: string, id: string) {
  const entry = await db.entries.get(id)
  return entry?.ownerId === ownerId ? entry : undefined
}

export async function listEntries(ownerId: string, filters: EntryFilters = {}) {
  const all = await db.entries.where('ownerId').equals(ownerId).toArray()
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

export async function deleteEntry(ownerId: string, id: string) {
  const current = await getEntry(ownerId, id)
  if (!current) throw new Error('找不到这条记录')
  await db.entries.delete(id)
  await queueDelete(ownerId, id, new Date().toISOString())
}

export async function allEntries(ownerId: string) {
  return db.entries.where('ownerId').equals(ownerId).toArray()
}

export async function listEntriesCreatedOn(ownerId: string, dateKey: string) {
  const entries = await allEntries(ownerId)
  return entries
    .filter((entry) => getEntryCreatedDateKey(entry) === dateKey)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function listEntriesOnThisDay(ownerId: string, referenceDate = new Date()) {
  const entries = await allEntries(ownerId)
  return entries
    .filter((entry) => isEntryOnThisDay(entry, referenceDate))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getRandomEntry(ownerId: string, excludeId?: string) {
  const entries = await allEntries(ownerId)
  const candidates = entries.filter((entry) => entry.id !== excludeId)
  if (candidates.length === 0) return entries[0]
  return candidates[Math.floor(Math.random() * candidates.length)]
}

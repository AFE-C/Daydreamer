import type { JSONContent } from '@tiptap/core'
import { db } from '../db/daydreamerDb'
import { ENTRY_COLORS, MOODS, type EntryColor, type EntryInput, type Mood } from '../types/entry'

export type NewEntryDraft = EntryInput & {
  ownerId: string
  updatedAt: string
}

const DRAFT_PREFIX = 'draft:new:'

function draftKey(ownerId: string) {
  return `${DRAFT_PREFIX}${ownerId}`
}

function isJsonContent(value: unknown): value is JSONContent {
  return Boolean(value && typeof value === 'object')
}

function isDraft(value: unknown, ownerId: string): value is NewEntryDraft {
  if (!value || typeof value !== 'object') return false
  const draft = value as Partial<NewEntryDraft>
  return Boolean(
    draft.ownerId === ownerId &&
    typeof draft.title === 'string' &&
    isJsonContent(draft.contentJson) &&
    typeof draft.contentText === 'string' &&
    Array.isArray(draft.tags) &&
    (draft.mood === undefined || (typeof draft.mood === 'string' && MOODS.includes(draft.mood as Mood))) &&
    typeof draft.color === 'string' &&
    ENTRY_COLORS.includes(draft.color as EntryColor) &&
    typeof draft.isFavorite === 'boolean' &&
    typeof draft.updatedAt === 'string',
  )
}

export function parseNewEntryDraft(value: unknown, ownerId: string): NewEntryDraft | undefined {
  return isDraft(value, ownerId) ? value : undefined
}

export async function getNewEntryDraft(ownerId: string): Promise<NewEntryDraft | undefined> {
  const stored = await db.settings.get(draftKey(ownerId))
  if (!stored) return undefined

  try {
    const parsed: unknown = JSON.parse(stored.value)
    const draft = parseNewEntryDraft(parsed, ownerId)
    if (draft) return draft
  } catch {
    // A broken local draft should not prevent the editor from opening.
  }

  await db.settings.delete(draftKey(ownerId))
  return undefined
}

export async function saveNewEntryDraft(ownerId: string, input: EntryInput) {
  const draft: NewEntryDraft = {
    ...input,
    ownerId,
    updatedAt: new Date().toISOString(),
  }
  await db.settings.put({ key: draftKey(ownerId), value: JSON.stringify(draft) })
}

export async function clearNewEntryDraft(ownerId: string) {
  await db.settings.delete(draftKey(ownerId))
}

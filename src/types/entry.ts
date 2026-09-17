import type { JSONContent } from '@tiptap/core'

export const MOODS = ['平静', '开心', '兴奋', '低落', '困惑', '灵感'] as const
export type Mood = (typeof MOODS)[number]

export const ENTRY_COLORS = ['blue', 'lavender', 'mint', 'pink'] as const
export type EntryColor = (typeof ENTRY_COLORS)[number]

export type Entry = {
  id: string
  ownerId?: string
  title: string
  contentJson: JSONContent
  contentText: string
  tags: string[]
  mood?: Mood
  color: EntryColor
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}

export type EntryInput = Pick<Entry, 'title' | 'contentJson' | 'contentText' | 'tags' | 'mood' | 'color' | 'isFavorite'>

export type EntryFilters = {
  search?: string
  tag?: string
  favoritesOnly?: boolean
}

export type DaydreamerBackup = {
  app: 'Daydreamer'
  version: 1
  exportedAt: string
  entries: Entry[]
}

export type ImportResult = {
  inserted: number
  updated: number
  skipped: number
}

export const EMPTY_CONTENT: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
}

export const DEFAULT_ENTRY_INPUT: EntryInput = {
  title: '',
  contentJson: EMPTY_CONTENT,
  contentText: '',
  tags: [],
  color: 'blue',
  isFavorite: false,
}

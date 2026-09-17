import { describe, expect, it } from 'vitest'
import { parseBackup } from './backup'

const entry = {
  id: 'entry-1',
  ownerId: 'another-user',
  title: '一条可携带的想法',
  contentJson: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '正文' }] }] },
  contentText: '正文',
  tags: ['灵感'],
  mood: '灵感' as const,
  color: 'blue' as const,
  isFavorite: false,
  createdAt: '2026-09-17T08:00:00.000Z',
  updatedAt: '2026-09-17T08:00:00.000Z',
}

describe('backup portability', () => {
  it('removes account ownership from imported backup records', () => {
    const backup = parseBackup({
      app: 'Daydreamer',
      version: 1,
      exportedAt: '2026-09-17T08:00:00.000Z',
      entries: [entry],
    })

    expect(backup.entries[0]).not.toHaveProperty('ownerId')
    expect(backup.entries[0]).toMatchObject({ id: 'entry-1', title: '一条可携带的想法' })
  })

  it('rejects backups from an unsupported app version', () => {
    expect(() => parseBackup({ app: 'Daydreamer', version: 2, entries: [] })).toThrow('兼容')
  })
})

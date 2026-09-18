import { describe, expect, it } from 'vitest'
import { parseNewEntryDraft } from './drafts'

describe('new entry drafts', () => {
  it('keeps draft ownership tied to the current account', () => {
    const ownerId = 'draft-test-user'
    const input = {
      ownerId,
      title: '一段未提交的想法',
      contentJson: { type: 'doc' as const, content: [{ type: 'paragraph' as const }] },
      contentText: '',
      tags: [],
      color: 'blue' as const,
      isFavorite: false,
      updatedAt: new Date().toISOString(),
    }

    expect(parseNewEntryDraft(input, ownerId)).toMatchObject({ ownerId, title: input.title })
    expect(parseNewEntryDraft(input, 'another-user')).toBeUndefined()
  })
})

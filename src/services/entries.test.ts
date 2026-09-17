import { describe, expect, it } from 'vitest'
import { getReviewDateBounds, isEntryOnThisDay, toLocalDateKey, toLocalMonthKey } from './entries'

describe('review date helpers', () => {
  it('formats a Date using the browser local date', () => {
    const date = new Date(2026, 8, 17, 10, 30)

    expect(toLocalDateKey(date)).toBe('2026-09-17')
    expect(toLocalMonthKey(date)).toBe('2026-09')
  })

  it('returns the earliest and latest valid entry dates', () => {
    const entries = [
      { createdAt: new Date(2024, 4, 3, 9).toISOString() },
      { createdAt: new Date(2022, 10, 21, 9).toISOString() },
      { createdAt: 'not-a-date' },
      { createdAt: new Date(2025, 1, 14, 9).toISOString() },
    ]

    expect(getReviewDateBounds(entries)).toEqual({
      earliestDateKey: '2022-11-21',
      latestDateKey: '2025-02-14',
    })
  })

  it('returns no bounds when there are no valid dates', () => {
    expect(getReviewDateBounds([{ createdAt: 'not-a-date' }])).toBeNull()
  })

  it('matches only previous years on the same month and day', () => {
    const referenceDate = new Date(2026, 8, 17, 12)

    expect(isEntryOnThisDay({ createdAt: new Date(2025, 8, 17, 9).toISOString() }, referenceDate)).toBe(true)
    expect(isEntryOnThisDay({ createdAt: new Date(2026, 8, 17, 9).toISOString() }, referenceDate)).toBe(false)
    expect(isEntryOnThisDay({ createdAt: new Date(2025, 8, 18, 9).toISOString() }, referenceDate)).toBe(false)
  })
})

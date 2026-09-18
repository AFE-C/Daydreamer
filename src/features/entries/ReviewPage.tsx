import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DATA_CHANGED_EVENT } from '../../app/events'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, ShuffleIcon, SparklesIcon } from '../../components/icons'
import { useReveal } from '../../hooks/useReveal'
import { getEntryCreatedDateKey, getRandomEntry, getReviewDateBounds, isEntryOnThisDay, listEntries, toLocalDateKey } from '../../services/entries'
import type { Entry } from '../../types/entry'
import { useAuth } from '../auth/AuthContext'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

function dateFromKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatDateKey(dateKey: string, withWeekday = false) {
  const date = dateFromKey(dateKey)
  if (Number.isNaN(date.getTime())) return '这一天'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(withWeekday ? { weekday: 'long' } : {}),
  }).format(date)
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long' }).format(date)
}

function formatEntryYear(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('zh-CN', { year: 'numeric' }).format(date)
}

function monthSerial(date: Date) {
  return date.getFullYear() * 12 + date.getMonth()
}

function dateAtMonthStart(dateKey: string) {
  const date = dateFromKey(dateKey)
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function shortContent(entry: Entry) {
  return entry.contentText || '还没有正文，点开继续写。'
}

function ReviewEntryLink({ entry, showYear = false }: { entry: Entry; showYear?: boolean }) {
  return (
    <Link to={`/entry/${entry.id}`} className="review-entry-link">
      <div className="review-entry-meta">
        <span>{showYear ? formatEntryYear(entry.createdAt) : formatDateKey(getEntryCreatedDateKey(entry))}</span>
        {entry.mood && <span className="review-entry-mood">{entry.mood}</span>}
      </div>
      <h3>{entry.title || '无标题'}</h3>
      <p>{shortContent(entry)}</p>
      {entry.tags.length > 0 && (
        <div className="review-entry-tags">
          {entry.tags.slice(0, 3).map((tag) => <span key={tag}>#{tag}</span>)}
        </div>
      )}
    </Link>
  )
}

export function ReviewPage() {
  const { user } = useAuth()
  const now = useMemo(() => new Date(), [])
  const todayKey = toLocalDateKey(now)
  const currentMonth = useMemo(() => new Date(now.getFullYear(), now.getMonth(), 1), [now])
  const [entries, setEntries] = useState<Entry[]>([])
  const [randomEntry, setRandomEntry] = useState<Entry | undefined>()
  const [monthCursor, setMonthCursor] = useState(currentMonth)
  const [selectedDate, setSelectedDate] = useState(todayKey)
  const [randomLoading, setRandomLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const featureReveal = useReveal<HTMLElement>()
  const calendarReveal = useReveal<HTMLElement>()

  async function loadReview() {
    try {
      setError('')
      if (!user) return
      const [nextEntries, nextRandom] = await Promise.all([listEntries(user.id), getRandomEntry(user.id)])
      setEntries(nextEntries)
      setRandomEntry(nextRandom)
    } catch {
      setError('回顾暂时无法打开，本地数据读取失败。请刷新页面再试。')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadReview()
    const handler = () => void loadReview()
    window.addEventListener(DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(DATA_CHANGED_EVENT, handler)
  }, [user?.id])

  const bounds = useMemo(() => getReviewDateBounds(entries), [entries])
  const earliestMonth = useMemo(() => bounds ? dateAtMonthStart(bounds.earliestDateKey) : currentMonth, [bounds, currentMonth])
  const currentMonthSerial = monthSerial(currentMonth)
  const displayedMonthSerial = monthSerial(monthCursor)
  const hasPreviousMonth = displayedMonthSerial > monthSerial(earliestMonth)
  const hasNextMonth = displayedMonthSerial < currentMonthSerial

  const entriesByDate = useMemo(() => {
    const map = new Map<string, number>()
    entries.forEach((entry) => {
      const dateKey = getEntryCreatedDateKey(entry)
      if (dateKey) map.set(dateKey, (map.get(dateKey) ?? 0) + 1)
    })
    return map
  }, [entries])

  const calendarDays = useMemo(() => {
    const firstDayOffset = (monthCursor.getDay() + 6) % 7
    const daysInMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0).getDate()
    return Array.from({ length: firstDayOffset + daysInMonth }, (_, index) => {
      if (index < firstDayOffset) return null
      return new Date(monthCursor.getFullYear(), monthCursor.getMonth(), index - firstDayOffset + 1)
    })
  }, [monthCursor])

  const selectedEntries = useMemo(
    () => entries.filter((entry) => getEntryCreatedDateKey(entry) === selectedDate),
    [entries, selectedDate],
  )

  const todayEntries = useMemo(() => {
    return entries
      .filter((entry) => isEntryOnThisDay(entry, now))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [entries, now])

  function selectMonth(nextMonth: Date) {
    const nextSerial = monthSerial(nextMonth)
    if (nextSerial < monthSerial(earliestMonth) || nextSerial > currentMonthSerial) return
    setMonthCursor(nextMonth)
    setSelectedDate(toLocalDateKey(nextMonth))
  }

  function goToToday() {
    setMonthCursor(currentMonth)
    setSelectedDate(todayKey)
  }

  async function changeRandomEntry() {
    if (!entries.length || randomLoading) return
    setRandomLoading(true)
    try {
      setError('')
      if (user) setRandomEntry(await getRandomEntry(user.id, randomEntry?.id))
    } catch {
      setError('随机灵感暂时无法更新，本地数据读取失败。请稍后再试。')
    } finally {
      setRandomLoading(false)
    }
  }

  const todayLabel = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric' }).format(now)

  if (loading) return <div className="loading-state review-loading">正在翻开你的回忆…</div>

  return (
    <div className="review-page">
      <section className="review-hero review-heading-panel" aria-labelledby="review-title">
        <div className="review-hero-copy">
          <span className="eyebrow"><CalendarIcon size={15} /> 回顾</span>
          <h1 id="review-title">朝花夕拾</h1>
          <p>有些想法不需要马上完成。隔一段时间再看，它们会告诉你曾经在意什么。</p>
        </div>
        <div className="review-date-chip" aria-label={`今天是${todayLabel}`}>
          <span>{now.getDate()}</span>
          <small>{now.toLocaleDateString('zh-CN', { month: 'long' })}</small>
        </div>
      </section>

      {error && <div className="inline-error" role="alert">{error}</div>}

      <section ref={featureReveal.ref} className={`review-feature-grid review-feature-stack scroll-reveal ${featureReveal.isVisible ? 'is-visible' : ''}`} aria-label="回顾推荐">
        <article className="review-card memory-card">
          <div className="review-card-header">
            <div>
              <span className="eyebrow"><SparklesIcon size={14} /> 今日往事</span>
              <h2>{todayLabel}</h2>
            </div>
            <span className="review-count">{todayEntries.length} 条</span>
          </div>
          {todayEntries.length > 0 ? (
            <div className="review-entry-list">
              {todayEntries.map((entry) => <ReviewEntryLink key={entry.id} entry={entry} showYear />)}
            </div>
          ) : (
            <div className="review-empty-card">
              <p>这一天还没有留下记录。</p>
              <span>先去看看随机灵感，也许会遇见曾经的自己。</span>
              <Link to="/entry/new" className="text-action">写下今天的记录</Link>
            </div>
          )}
        </article>

        <article className="review-card random-card">
          <div className="review-card-header">
            <div>
              <span className="eyebrow"><ShuffleIcon size={14} /> 随机灵感</span>
              <h2>让旧想法再亮一下</h2>
            </div>
            <button type="button" className="review-refresh" onClick={() => void changeRandomEntry()} disabled={!entries.length || randomLoading}>
              <ShuffleIcon size={15} /> {randomLoading ? '正在换一条' : '换一条灵感'}
            </button>
          </div>
          <div className="random-entry-wrap" aria-live="polite">
            {randomEntry ? <ReviewEntryLink entry={randomEntry} /> : (
              <div className="review-empty-card">
                <p>还没有可以回看的记录。</p>
                <span>写下第一条，未来的你会在这里遇见它。</span>
                <Link to="/entry/new" className="text-action">写下第一条</Link>
              </div>
            )}
          </div>
        </article>
      </section>

      <section ref={calendarReveal.ref} className={`review-calendar-section scroll-reveal ${calendarReveal.isVisible ? 'is-visible' : ''}`} aria-labelledby="calendar-title">
        <div className="section-heading review-section-heading">
          <div>
            <span className="eyebrow">按日期回看</span>
            <h2 id="calendar-title">翻一翻时间</h2>
          </div>
          {selectedDate !== todayKey && <button type="button" className="today-button" onClick={goToToday}>回到今天</button>}
        </div>

        <div className="review-calendar-layout">
          <div className="review-calendar" aria-label={`${formatMonth(monthCursor)}日历`}>
            <div className="calendar-toolbar">
              <button type="button" className="calendar-nav" onClick={() => selectMonth(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))} disabled={!hasPreviousMonth} aria-label="上一个月"><ChevronLeftIcon size={18} /></button>
              <strong>{formatMonth(monthCursor)}</strong>
              <button type="button" className="calendar-nav" onClick={() => selectMonth(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))} disabled={!hasNextMonth} aria-label="下一个月"><ChevronRightIcon size={18} /></button>
            </div>
            <div className="calendar-weekdays" aria-hidden="true">{WEEKDAYS.map((weekday) => <span key={weekday}>{weekday}</span>)}</div>
            <div className="calendar-grid">
              {calendarDays.map((date, index) => {
                if (!date) return <span className="calendar-blank" key={`blank-${index}`} />
                const dateKey = toLocalDateKey(date)
                const entryCount = entriesByDate.get(dateKey) ?? 0
                const isToday = dateKey === todayKey
                const isSelected = dateKey === selectedDate
                return (
                  <button
                    type="button"
                    key={dateKey}
                    className={`calendar-day ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''} ${entryCount ? 'has-entries' : ''}`}
                    onClick={() => setSelectedDate(dateKey)}
                    aria-label={`${formatDateKey(dateKey)}${entryCount ? `，${entryCount} 条记录` : ''}`}
                    aria-pressed={isSelected}
                  >
                    <span>{date.getDate()}</span>
                    {entryCount > 0 && <i aria-hidden="true" />}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="review-day-panel">
            <div className="review-day-heading">
              <span className="eyebrow">选中的一天</span>
              <span className="review-count">{selectedEntries.length} 条记录</span>
            </div>
            <h3>{formatDateKey(selectedDate, true)}</h3>
            {selectedEntries.length > 0 ? (
              <div className="review-entry-list selected-entry-list">
                {selectedEntries.map((entry) => <ReviewEntryLink key={entry.id} entry={entry} />)}
              </div>
            ) : (
              <div className="review-day-empty">
                <p>这一天还没有记录。</p>
                <span>换个日期，继续看看留下的内容。</span>
                {selectedDate === todayKey ? <Link to="/entry/new" className="text-action">写下今天的记录</Link> : <button type="button" className="text-action text-button" onClick={goToToday}>回到今天</button>}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

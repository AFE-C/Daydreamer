import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DATA_CHANGED_EVENT } from '../../app/events'
import { PlusIcon, SearchIcon } from '../../components/icons'
import { listEntries, toLocalDateKey } from '../../services/entries'
import type { Entry } from '../../types/entry'
import { EntryCard } from './EntryCard'
import { useAuth } from '../auth/AuthContext'

function formatEntryDay(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '未标注日期'
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }).format(date)
}

export function TimelinePage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<Entry[]>([])
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadEntries() {
    if (!user) return
    try {
      setError('')
      setEntries(await listEntries(user.id))
    } catch {
      setError('暂时无法读取记录，请刷新页面再试。')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadEntries()
    const handler = () => void loadEntries()
    window.addEventListener(DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(DATA_CHANGED_EVENT, handler)
  }, [user?.id])

  const tags = useMemo(() => [...new Set(entries.flatMap((entry) => entry.tags))].sort(), [entries])
  const visibleEntries = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return entries.filter((entry) => {
      if (favoritesOnly && !entry.isFavorite) return false
      if (activeTag && !entry.tags.includes(activeTag)) return false
      if (!query) return true
      return [entry.title, entry.contentText, ...entry.tags].some((value) => value.toLocaleLowerCase().includes(query))
    })
  }, [activeTag, entries, favoritesOnly, search])

  const entryGroups = useMemo(() => {
    const groups = new Map<string, Entry[]>()
    visibleEntries.forEach((entry) => {
      const key = toLocalDateKey(entry.updatedAt) || 'unknown'
      groups.set(key, [...(groups.get(key) ?? []), entry])
    })
    return [...groups.entries()].map(([key, groupEntries]) => ({
      key,
      label: groupEntries[0] ? formatEntryDay(groupEntries[0].updatedAt) : '未标注日期',
      entries: groupEntries,
    }))
  }, [visibleEntries])

  return (
    <div className="timeline-page">
      <section className="timeline-intro">
        <div className="timeline-intro-copy">
          <span className="timeline-kicker">记录空间</span>
          <h1>把想法留在这里。</h1>
          <p>不用整理好，先写下来。</p>
        </div>
        <Link to="/entry/new" className="button button-primary timeline-quick-action"><PlusIcon size={18} /> 快速记录</Link>
      </section>

      <section className="timeline-section" aria-labelledby="timeline-title">
        <div className="timeline-tool-surface">
          <div className="timeline-toolbar">
            <label className="search-box">
              <SearchIcon size={18} />
              <span className="visually-hidden">搜索记录</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="查找标题、内容或标签" />
              {search && <button type="button" onClick={() => setSearch('')} aria-label="清除搜索">×</button>}
            </label>
            <button type="button" className={`filter-toggle ${favoritesOnly ? 'active' : ''}`} onClick={() => setFavoritesOnly((value) => !value)}>
              <span className="filter-heart">♡</span> 仅看收藏
            </button>
          </div>

          {tags.length > 0 && <div className="filter-row" aria-label="按标签筛选">
            <button type="button" className={`filter-chip ${activeTag === null ? 'active' : ''}`} onClick={() => setActiveTag(null)}>全部记录</button>
            {tags.map((tag) => <button type="button" key={tag} className={`filter-chip ${activeTag === tag ? 'active' : ''}`} onClick={() => setActiveTag(activeTag === tag ? null : tag)}>#{tag}</button>)}
          </div>}
        </div>

        <div className="section-heading">
          <div>
            <span className="eyebrow">你的记录</span>
            <h2 id="timeline-title">最近留下的</h2>
          </div>
          <span className="entry-count">共 {entries.length} 条</span>
        </div>

        {error && <div className="inline-error">{error}</div>}
        {loading ? <div className="loading-state">正在打开你的时间线…</div> : entryGroups.length > 0 ? (
          <div className="entry-groups">
            {entryGroups.map((group) => (
              <section className="entry-day-group" key={group.key} aria-labelledby={`entry-day-${group.key}`}>
                <div className="entry-day-heading">
                  <h3 id={`entry-day-${group.key}`}>{group.label}</h3>
                  <span>{group.entries.length} 条</span>
                </div>
                <div className="entry-list">
                  {group.entries.map((entry) => <EntryCard key={entry.id} entry={entry} ownerId={user!.id} />)}
                </div>
              </section>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="empty-state">
            <h3>A quiet place for your next thought.</h3>
            <p>Start with one small idea and let it grow.</p>
            <Link to="/entry/new" className="button button-soft"><PlusIcon size={17} /> Write your first note</Link>
          </div>
        ) : (
          <div className="empty-state compact-empty">
            <h3>暂时没有找到它。</h3>
            <p>试试换一个关键词，或清除筛选。</p>
          </div>
        )}
      </section>
    </div>
  )
}

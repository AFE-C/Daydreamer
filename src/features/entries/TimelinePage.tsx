import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DATA_CHANGED_EVENT } from '../../app/events'
import { PlusIcon, SearchIcon, SparklesIcon } from '../../components/icons'
import { listEntries } from '../../services/entries'
import type { Entry } from '../../types/entry'
import { EntryCard } from './EntryCard'

export function TimelinePage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadEntries() {
    try {
      setError('')
      setEntries(await listEntries())
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
  }, [])

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

  return (
    <div className="timeline-page">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow"><SparklesIcon size={15} /> 从一句话开始</span>
          <h1>把脑海里的微光，<br /><em>留在这里。</em></h1>
          <p>不必整理好再开始。一段片刻、一种心情，或一件还没想明白的事，都值得被记下来。</p>
          <Link to="/entry/new" className="button button-primary"><PlusIcon size={18} /> 写下此刻</Link>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-note">
            <div className="hero-note-top"><span className="signal-dot" /><span>此刻的记录</span><span className="note-index">草稿</span></div>
            <div className="hero-note-body"><span className="note-symbol">“</span><p>先记下来，<br /><em>再慢慢想明白。</em></p></div>
            <div className="hero-note-bottom"><span className="glass-pill">灵感</span><span className="note-line" /></div>
          </div>
        </div>
      </section>

      <section className="timeline-section" aria-labelledby="timeline-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">你的记录</span>
            <h2 id="timeline-title">最近留下的</h2>
          </div>
          <span className="entry-count">共 {entries.length} 条</span>
        </div>

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

        {error && <div className="inline-error">{error}</div>}
        {loading ? <div className="loading-state">正在打开你的时间线…</div> : visibleEntries.length > 0 ? (
          <div className="entry-grid">{visibleEntries.map((entry) => <EntryCard key={entry.id} entry={entry} />)}</div>
        ) : entries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-orb" aria-hidden="true"><span className="empty-orb-glass" /></div>
            <h3>还没有写下第一条。</h3>
            <p>从眼前的一点想法开始，等它慢慢长成自己的样子。</p>
            <Link to="/entry/new" className="button button-soft"><PlusIcon size={17} /> 写下第一条</Link>
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

import { Link } from 'react-router-dom'
import type { Entry } from '../../types/entry'
import { HeartIcon } from '../../components/icons'
import { updateEntry } from '../../services/entries'
import { DATA_CHANGED_EVENT } from '../../app/events'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric' }).format(new Date(value))
}

type EntryCardProps = {
  entry: Entry
}

export function EntryCard({ entry }: EntryCardProps) {
  async function toggleFavorite(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    await updateEntry(entry.id, { isFavorite: !entry.isFavorite })
    window.dispatchEvent(new Event(DATA_CHANGED_EVENT))
  }

  return (
    <Link to={`/entry/${entry.id}`} className={`entry-card card-${entry.color}`}>
      <div className="entry-card-topline">
        <span className="entry-date">{formatDate(entry.updatedAt)}</span>
        <button type="button" className={`favorite-button ${entry.isFavorite ? 'is-favorite' : ''}`} onClick={toggleFavorite} aria-label={entry.isFavorite ? '取消收藏' : '收藏'}>
          <HeartIcon size={18} filled={entry.isFavorite} />
        </button>
      </div>
      <h3>{entry.title || '无标题'}</h3>
      <p className="entry-preview">{entry.contentText || '还没有正文，点开继续写。'}</p>
      <div className="entry-card-footer">
        <div className="tag-list">
          {entry.tags.slice(0, 3).map((tag) => <span className="tag-pill" key={tag}>#{tag}</span>)}
        </div>
        {entry.mood && <span className="mood-mark">{entry.mood}</span>}
      </div>
    </Link>
  )
}

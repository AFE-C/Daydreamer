import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import LinkExtension from '@tiptap/extension-link'
import { DATA_CHANGED_EVENT } from '../../app/events'
import { ArrowLeftIcon, CheckIcon, HeartIcon, LinkIcon, TrashIcon } from '../../components/icons'
import { createEntry, deleteEntry, extractText, getEntry, updateEntry } from '../../services/entries'
import { clearNewEntryDraft, getNewEntryDraft, saveNewEntryDraft } from '../../services/drafts'
import { DEFAULT_ENTRY_INPUT, ENTRY_COLORS, MOODS, type Entry, type EntryColor, type EntryInput, type Mood } from '../../types/entry'
import { useAuth } from '../auth/AuthContext'

function formatFullDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(value))
}

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null
  return (
    <div className="editor-toolbar" aria-label="文本格式">
      <button type="button" className={editor.isActive('bold') ? 'active' : ''} onClick={() => editor.chain().focus().toggleBold().run()} aria-label="粗体"><strong>B</strong></button>
      <button type="button" className={editor.isActive('italic') ? 'active' : ''} onClick={() => editor.chain().focus().toggleItalic().run()} aria-label="斜体"><em>I</em></button>
      <button type="button" className={editor.isActive('strike') ? 'active' : ''} onClick={() => editor.chain().focus().toggleStrike().run()} aria-label="删除线"><s>S</s></button>
      <span className="toolbar-divider" />
      <button type="button" className={editor.isActive('heading', { level: 2 }) ? 'active' : ''} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} aria-label="小标题">H2</button>
      <button type="button" className={editor.isActive('bulletList') ? 'active' : ''} onClick={() => editor.chain().focus().toggleBulletList().run()} aria-label="项目列表">☷</button>
      <button type="button" className={editor.isActive('orderedList') ? 'active' : ''} onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-label="编号列表">≡</button>
      <button type="button" className={editor.isActive('blockquote') ? 'active' : ''} onClick={() => editor.chain().focus().toggleBlockquote().run()} aria-label="引用">“</button>
      <button type="button" className={editor.isActive('link') ? 'active' : ''} onClick={() => {
        const url = window.prompt('输入链接地址')
        if (url) editor.chain().focus().setLink({ href: url }).run()
      }} aria-label="添加链接"><LinkIcon size={16} /></button>
      <span className="toolbar-spacer" />
      <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} aria-label="撤销">↶</button>
      <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} aria-label="重做">↷</button>
    </div>
  )
}

export function EntryEditorPage() {
  const { user } = useAuth()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [entry, setEntry] = useState<Entry | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [mood, setMood] = useState<Mood | undefined>()
  const [color, setColor] = useState<EntryColor>('blue')
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoritePulse, setFavoritePulse] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [draftSaveState, setDraftSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [draftRestored, setDraftRestored] = useState(false)
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [propertiesOpen, setPropertiesOpen] = useState(false)
  const [editorVersion, setEditorVersion] = useState(0)
  const titleRef = useRef(title)
  const tagsRef = useRef(tags)
  const moodRef = useRef(mood)
  const colorRef = useRef(color)
  const favoriteRef = useRef(isFavorite)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2] } }),
      LinkExtension.configure({ openOnClick: false, autolink: true }),
    ],
    content: DEFAULT_ENTRY_INPUT.contentJson,
    editorProps: {
      attributes: { class: 'entry-prosemirror', 'aria-label': '记录正文' },
    },
    onUpdate: () => setEditorVersion((value) => value + 1),
  })

  useEffect(() => {
    let active = true
    if (!user || !editor) return () => { active = false }
    setLoaded(false)
    setSaveState('idle')
    setDraftSaveState('idle')
    setSubmitState('idle')
    setPropertiesOpen(false)

    if (!id) {
      setEntry(null)
      void getNewEntryDraft(user.id).then((draft) => {
        if (!active) return
        setTitle(draft?.title ?? '')
        setTags(draft?.tags ?? [])
        setMood(draft?.mood)
        setColor(draft?.color ?? DEFAULT_ENTRY_INPUT.color)
        setIsFavorite(draft?.isFavorite ?? false)
        editor.commands.setContent(draft?.contentJson ?? DEFAULT_ENTRY_INPUT.contentJson)
        setDraftRestored(Boolean(draft))
        setLoaded(true)
      }).catch(() => {
        if (!active) return
        setDraftRestored(false)
        setLoaded(true)
      })
      return () => { active = false }
    }

    void getEntry(user.id, id).then((found) => {
      if (!active) return
      if (!found) {
        navigate('/', { replace: true })
        return
      }
      setEntry(found)
      setTitle(found.title)
      setTags(found.tags)
      setMood(found.mood)
      setColor(found.color)
      setIsFavorite(found.isFavorite)
      setDraftRestored(false)
      editor.commands.setContent(found.contentJson)
      setLoaded(true)
    }).catch(() => navigate('/', { replace: true }))
    return () => { active = false }
  }, [editor, id, navigate, user?.id])

  useEffect(() => { titleRef.current = title }, [title])
  useEffect(() => { tagsRef.current = tags }, [tags])
  useEffect(() => { moodRef.current = mood }, [mood])
  useEffect(() => { colorRef.current = color }, [color])
  useEffect(() => { favoriteRef.current = isFavorite }, [isFavorite])

  const currentContentText = useMemo(() => editor?.getText().trim() ?? '', [editor, editorVersion])

  const collectInput = useCallback((): EntryInput => {
    const contentJson = editor?.getJSON() ?? DEFAULT_ENTRY_INPUT.contentJson
    return {
      title: title.trim(),
      contentJson,
      contentText: extractText(contentJson),
      tags,
      mood,
      color,
      isFavorite,
    }
  }, [color, editor, isFavorite, mood, tags, title])

  const persistNewDraft = useCallback(async () => {
    if (!user || entry?.id || !editor) return true
    const input = collectInput()
    const hasContent = Boolean(input.title || input.contentText || input.tags.length || input.mood)
    setDraftSaveState('saving')
    try {
      if (hasContent) await saveNewEntryDraft(user.id, input)
      else await clearNewEntryDraft(user.id)
      setDraftSaveState(hasContent ? 'saved' : 'idle')
      return true
    } catch {
      setDraftSaveState('error')
      return false
    }
  }, [collectInput, editor, entry?.id, user])

  useEffect(() => {
    if (!loaded || !editor || !user || entry?.id || submitState === 'submitting' || submitState === 'success') return
    const timer = window.setTimeout(() => void persistNewDraft(), 160)
    return () => window.clearTimeout(timer)
  }, [editor, entry?.id, loaded, persistNewDraft, submitState, user])

  useEffect(() => {
    if (!loaded || !editor || !entry?.id) return
    const contentText = editor.getText().trim()
    if (!titleRef.current.trim() && !contentText) return

    setSaveState('saving')
    const timer = window.setTimeout(async () => {
      const contentJson = editor.getJSON()
      const input = {
        title: titleRef.current.trim(),
        contentJson,
        contentText: extractText(contentJson),
        tags: tagsRef.current,
        mood: moodRef.current,
        color: colorRef.current,
        isFavorite: favoriteRef.current,
      }
      try {
        if (!user) throw new Error('登录状态已失效')
        const saved = await updateEntry(user.id, entry.id, input)
        setEntry(saved)
        window.dispatchEvent(new Event(DATA_CHANGED_EVENT))
        setSaveState('saved')
      } catch {
        setSaveState('error')
      }
    }, 600)
    return () => window.clearTimeout(timer)
  }, [color, editor, editorVersion, entry?.id, isFavorite, loaded, mood, tags, title, user?.id])

  async function handleSubmit() {
    if (!user || !editor || entry?.id || submitState === 'submitting' || submitState === 'success') return
    const input = collectInput()
    if (!input.title && !input.contentText) return

    setSubmitState('submitting')
    const draftSaved = await persistNewDraft()
    if (!draftSaved) {
      setSubmitState('error')
      return
    }

    try {
      await createEntry(user.id, input)
      await clearNewEntryDraft(user.id)
      setDraftRestored(false)
      setSubmitState('success')
      window.dispatchEvent(new Event(DATA_CHANGED_EVENT))
      window.setTimeout(() => navigate('/', { replace: true }), 800)
    } catch {
      setSubmitState('error')
    }
  }

  async function handleDiscardDraft() {
    if (!user || entry?.id) return
    if (!window.confirm('丢弃这份草稿？未提交的内容会从本机删除。')) return
    try {
      await clearNewEntryDraft(user.id)
      navigate('/', { replace: true })
    } catch {
      setDraftSaveState('error')
    }
  }

  async function handleBack(event: MouseEvent<HTMLAnchorElement>) {
    if (entry?.id) return
    event.preventDefault()
    if (await persistNewDraft()) navigate('/')
  }

  function addTag() {
    const next = tagInput.trim().replace(/^#/, '')
    if (next && !tags.includes(next)) setTags((current) => [...current, next].slice(0, 12))
    setTagInput('')
  }

  function toggleFavorite() {
    setIsFavorite((value) => !value)
    setFavoritePulse(true)
    window.setTimeout(() => setFavoritePulse(false), 360)
  }

  async function handleDelete() {
    if (!entry?.id) return
    if (!window.confirm('确定要删除这条记录吗？删除后无法从 Daydreamer 恢复。')) return
    if (!user) return
    try {
      await deleteEntry(user.id, entry.id)
      window.dispatchEvent(new Event(DATA_CHANGED_EVENT))
      navigate('/')
    } catch {
      setSaveState('error')
    }
  }

  const displayDate = entry?.updatedAt ?? new Date().toISOString()

  if (!loaded) return <div className="loading-state editor-loading">正在打开这条记录…</div>

  const canSubmit = Boolean(title.trim() || currentContentText)
  const hasDraftValue = Boolean(title.trim() || currentContentText || tags.length || mood)
  const propertySummary = [mood, tags.length ? `${tags.length} 个标签` : '', color === 'blue' ? '青蓝' : color === 'lavender' ? '淡紫' : color === 'mint' ? '薄荷' : '浅粉'].filter(Boolean).join(' · ')

  return (
    <div className={`editor-page editor-${color}`}>
      <div className="editor-topbar">
        <Link to="/" className="back-link" onClick={(event) => void handleBack(event)}><ArrowLeftIcon size={18} /> 返回时间线</Link>
        <div className="editor-status" aria-live="polite">
          {entry?.id && saveState === 'saving' && <><span className="save-dot saving-dot" />正在保存</>}
          {entry?.id && saveState === 'saved' && <><CheckIcon size={15} />已保存</>}
          {entry?.id && saveState === 'error' && <span className="save-error">保存失败，内容仍在本机。请再试一次。</span>}
          {!entry?.id && submitState === 'submitting' && <><span className="save-dot saving-dot" />正在提交</>}
          {!entry?.id && submitState === 'success' && <><CheckIcon size={15} />记录已提交</>}
          {!entry?.id && submitState === 'error' && <span className="save-error">提交失败，草稿仍在本机。请再试一次。</span>}
          {!entry?.id && submitState === 'idle' && draftSaveState === 'saving' && <><span className="save-dot saving-dot" />正在保存草稿</>}
          {!entry?.id && submitState === 'idle' && draftSaveState === 'saved' && <><CheckIcon size={15} />草稿已保存</>}
          {!entry?.id && submitState === 'idle' && draftSaveState === 'error' && <span className="save-error">草稿保存失败，请暂时不要离开此页。</span>}
        </div>
        <div className="editor-actions">
          {!entry?.id && <button type="button" className="button button-primary editor-submit" onClick={() => void handleSubmit()} disabled={!canSubmit || submitState === 'submitting' || submitState === 'success'}>{submitState === 'submitting' ? '正在提交…' : submitState === 'success' ? '已提交 ✓' : submitState === 'error' ? '重新提交' : '提交记录'}</button>}
          <button type="button" className={`icon-button ${isFavorite ? 'is-favorite' : ''} ${favoritePulse ? 'favorite-pulse' : ''}`} onClick={toggleFavorite} aria-label={isFavorite ? '取消收藏' : '收藏'}><HeartIcon filled={isFavorite} /></button>
          {entry && <button type="button" className="icon-button danger-icon" onClick={() => void handleDelete()} aria-label="删除记录"><TrashIcon size={19} /></button>}
        </div>
      </div>

      <div className="editor-layout">
        <section className="editor-main-column">
          <div className="editor-date">{entry ? formatFullDate(displayDate) : '今天 · 新记录'}</div>
          {!entry && draftRestored && <div className="draft-recovered" role="status"><CheckIcon size={14} />已恢复草稿<span>内容仍保存在这台设备</span></div>}
          <input className="title-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="给这段想法起个名字（可不填）" aria-label="记录标题" autoFocus={!entry} />
          <div className={`editor-properties ${propertiesOpen ? 'is-open' : ''}`}>
            <button type="button" className="editor-properties-toggle" aria-expanded={propertiesOpen} aria-controls="editor-properties-panel" onClick={() => setPropertiesOpen((open) => !open)}>
              <span>记录属性</span>
              <small>{propertySummary || '心情、标签与颜色'}</small>
              <span className="properties-chevron" aria-hidden="true">⌄</span>
            </button>
            <div id="editor-properties-panel" className="editor-properties-panel" aria-hidden={!propertiesOpen}>
              <div className="editor-sidebar">
                <div className="sidebar-block sidebar-block-mood">
                  <span className="sidebar-label">心情</span>
                  <div className="mood-options">
                    {MOODS.map((option) => <button type="button" key={option} className={`mood-option ${mood === option ? 'selected' : ''}`} onClick={() => setMood(mood === option ? undefined : option)}>{option}</button>)}
                  </div>
                </div>
                <div className="sidebar-block sidebar-block-tags">
                  <span className="sidebar-label">标签</span>
                  <div className="tag-editor">
                    {tags.map((tag) => <button type="button" className="editable-tag" key={tag} onClick={() => setTags((current) => current.filter((item) => item !== tag))}>#{tag}<span>×</span></button>)}
                    <input value={tagInput} onChange={(event) => setTagInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addTag() } }} onBlur={addTag} placeholder={tags.length ? '添加标签' : '输入后回车'} aria-label="添加标签" />
                  </div>
                  <small className="sidebar-hint">按 Enter 添加，点击标签移除</small>
                </div>
                <div className="sidebar-block sidebar-block-colors">
                  <span className="sidebar-label">卡片颜色</span>
                  <div className="color-options">
                    {ENTRY_COLORS.map((option) => <button type="button" key={option} className={`color-option color-${option} ${color === option ? 'selected' : ''}`} onClick={() => setColor(option)} aria-label={`使用${option}色卡片`} />)}
                  </div>
                </div>
                <div className="sidebar-note"><span>✦</span><p>先记下来，再慢慢想明白。</p></div>
                {!entry && hasDraftValue && <button type="button" className="draft-discard" onClick={() => void handleDiscardDraft()}>丢弃草稿</button>}
              </div>
            </div>
          </div>
          <div className="editor-surface">
            <EditorToolbar editor={editor} />
            <div className="editor-content-wrap">
              <EditorContent editor={editor} />
              {!currentContentText && <span className="editor-placeholder" aria-hidden="true">从一句话开始。不必完整，也不必正确。</span>}
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}

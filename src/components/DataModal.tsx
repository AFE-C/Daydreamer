import { useRef, useState } from 'react'
import { DATA_CHANGED_EVENT } from '../app/events'
import { exportBackup, importBackup } from '../services/backup'
import { DownloadIcon, UploadIcon } from './icons'

type DataModalProps = {
  onClose: () => void
}

export function DataModal({ onClose }: DataModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  async function handleExport() {
    try {
      const backup = await exportBackup()
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `daydreamer-backup-${new Date().toISOString().slice(0, 10)}.json`
      anchor.click()
      URL.revokeObjectURL(url)
      setStatus({ kind: 'success', text: '备份已下载到你的设备。' })
    } catch {
      setStatus({ kind: 'error', text: '导出失败，请稍后再试。' })
    }
  }

  async function handleImport(file: File) {
    try {
      const parsed = JSON.parse(await file.text())
      const result = await importBackup(parsed)
      window.dispatchEvent(new Event(DATA_CHANGED_EVENT))
      setStatus({ kind: 'success', text: `已导入 ${result.inserted + result.updated} 条记录，跳过 ${result.skipped} 条旧记录。` })
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : '导入失败，请检查文件。' })
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="data-title">
        <div className="modal-heading">
          <div>
            <span className="eyebrow">数据备份</span>
            <h2 id="data-title">把记录带在身边</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="关闭备份与恢复">×</button>
        </div>
        <p className="modal-description">记录保存在当前浏览器。导出一份 JSON 备份，方便你以后恢复，也方便自己保管。</p>
        <div className="data-actions">
          <button type="button" className="data-action" onClick={handleExport}>
            <span className="data-action-icon blue-icon"><DownloadIcon /></span>
            <span><strong>导出全部记录</strong><small>保存正文、标签和心情</small></span>
          </button>
          <button type="button" className="data-action" onClick={() => inputRef.current?.click()}>
            <span className="data-action-icon lavender-icon"><UploadIcon /></span>
            <span><strong>导入备份文件</strong><small>与当前记录安全合并</small></span>
          </button>
        </div>
        {status && <p className={`modal-status ${status.kind}`}>{status.text}</p>}
        <input ref={inputRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void handleImport(file)
          event.target.value = ''
        }} />
      </section>
    </div>
  )
}

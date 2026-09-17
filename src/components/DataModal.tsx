import { useRef, useState } from 'react'
import { DATA_CHANGED_EVENT } from '../app/events'
import { usePwaInstall } from '../hooks/usePwa'
import { exportBackup, importBackup } from '../services/backup'
import { DownloadIcon, SparklesIcon, UploadIcon } from './icons'

type DataModalProps = {
  onClose: () => void
}

export function DataModal({ onClose }: DataModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { canInstall, isInstalled, isIos, promptInstall } = usePwaInstall()
  const [installing, setInstalling] = useState(false)
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  async function handleInstall() {
    if (!canInstall) {
      setStatus({
        kind: 'success',
        text: isIos
          ? '请点 Safari 底部的“分享”，再选择“添加到主屏幕”。'
          : '请打开浏览器菜单，选择“安装 Daydreamer”或“添加到主屏幕”。',
      })
      return
    }

    setInstalling(true)
    const accepted = await promptInstall()
    setInstalling(false)

    if (!accepted) {
      setStatus({ kind: 'success', text: '可以随时从浏览器菜单安装 Daydreamer。' })
    }
  }

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
            {!isInstalled && canInstall && (
              <button type="button" className="data-action" onClick={() => void handleInstall()} disabled={installing}>
                <span className="data-action-icon mint-icon"><SparklesIcon /></span>
                <span><strong>{installing ? '正在准备安装…' : '安装 Daydreamer'}</strong><small>放到手机或桌面，断网也能打开</small></span>
              </button>
            )}
            {!isInstalled && !canInstall && (
              <button type="button" className="data-action" onClick={() => void handleInstall()}>
                <span className="data-action-icon mint-icon"><SparklesIcon /></span>
                <span>
                  <strong>{isIos ? '添加到主屏幕' : '从浏览器安装'}</strong>
                  <small>{isIos ? '点击查看 Safari 安装步骤' : '点击查看浏览器安装入口'}</small>
                </span>
              </button>
            )}
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

import { FormEvent, useState } from 'react'
import { useAuth } from './AuthContext'

type Mode = 'login' | 'signup' | 'reset'

export function AuthPage() {
  const { configReady, authError, signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    setFormError('')
    try {
      if (mode === 'reset') {
        await resetPassword(email)
        setMessage('如果这个邮箱已注册，密码重置邮件很快会到达。')
      } else if (mode === 'login') {
        await signIn(email, password)
      } else {
        const result = await signUp(email, password)
        setMessage(result.needsEmailConfirmation ? '注册成功。请先查收验证邮件，再回来登录。' : '注册成功，正在打开你的空间。')
        if (result.needsEmailConfirmation) setMode('login')
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '操作失败，请稍后再试。')
    } finally {
      setBusy(false)
    }
  }

  const isReset = mode === 'reset'
  return (
    <main className="auth-page">
      <div className="auth-orbit auth-orbit-one" aria-hidden="true" />
      <div className="auth-orbit auth-orbit-two" aria-hidden="true" />
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-brand" aria-hidden="true"><span>✦</span><em>Daydreamer</em></div>
        <span className="eyebrow">你的私人灵感空间</span>
        <h1 id="auth-title">{isReset ? '找回你的入口' : mode === 'signup' ? '为自己留一处' : '欢迎回来'}</h1>
        <p className="auth-intro">{isReset ? '输入注册邮箱，我们会发一封密码重置邮件。' : '把脑海里的微光，安全地留在这里。'}</p>

        {!configReady && <div className="auth-alert error">云端服务尚未配置，请先设置 Supabase 环境变量。</div>}
        {(authError || formError) && <div className="auth-alert error">{formError || authError}</div>}
        {message && <div className="auth-alert success">{message}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>邮箱<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></label>
          {!isReset && <label>密码<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="至少 6 位字符" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={6} required /></label>}
          <button className="button button-primary auth-submit" type="submit" disabled={busy || !configReady}>{busy ? '请稍候…' : isReset ? '发送重置邮件' : mode === 'signup' ? '创建我的空间' : '进入 Daydreamer'}</button>
        </form>

        <div className="auth-links">
          {isReset ? <button type="button" onClick={() => { setMode('login'); setMessage(''); setFormError('') }}>返回登录</button> : <>
            <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(''); setFormError('') }}>{mode === 'login' ? '第一次来？创建账号' : '已有账号？直接登录'}</button>
            {mode === 'login' && <button type="button" onClick={() => { setMode('reset'); setMessage(''); setFormError('') }}>忘记密码</button>}
          </>}
        </div>
        <small className="auth-note">登录后，当前设备会保留本地缓存；联网时自动与其他设备同步。</small>
      </section>
    </main>
  )
}

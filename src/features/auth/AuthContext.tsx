import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { db } from '../../db/daydreamerDb'
import { supabase, supabaseConfig } from '../../lib/supabase'
import { claimLegacyEntries } from '../../services/syncQueue'
import { createSyncController, syncUser } from '../../services/sync'

type AuthContextValue = {
  session: Session | null
  user: User | null
  loading: boolean
  configReady: boolean
  authError: string
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>
  resetPassword: (email: string) => Promise<void>
  signOut: () => Promise<void>
  deleteAccount: () => Promise<void>
  syncNow: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readableAuthError(message: string) {
  if (message.includes('Invalid login credentials')) return '邮箱或密码不正确。'
  if (message.includes('Email not confirmed')) return '请先完成邮箱验证，再登录。'
  if (message.includes('User already registered')) return '这个邮箱已经注册过了，请直接登录。'
  if (message.includes('Password should be at least')) return '密码至少需要 6 位。'
  if (message.includes('rate limit')) return '操作太频繁，请稍后再试。'
  return message
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const user = session?.user ?? null

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let active = true
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) setAuthError(readableAuthError(error.message))
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    void (async () => {
      await claimLegacyEntries(user.id)
      if (!cancelled) await syncUser(user.id)
    })()
    const stopSync = createSyncController(user.id)
    return () => {
      cancelled = true
      stopSync()
    }
  }, [user?.id])

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user,
    loading,
    configReady: supabaseConfig.isConfigured,
    authError,
    async signIn(email, password) {
      if (!supabase) throw new Error('尚未配置 Supabase，请检查部署环境变量。')
      setAuthError('')
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) {
        const message = readableAuthError(error.message)
        setAuthError(message)
        throw new Error(message)
      }
    },
    async signUp(email, password) {
      if (!supabase) throw new Error('尚未配置 Supabase，请检查部署环境变量。')
      setAuthError('')
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: window.location.origin + import.meta.env.BASE_URL },
      })
      if (error) {
        const message = readableAuthError(error.message)
        setAuthError(message)
        throw new Error(message)
      }
      return { needsEmailConfirmation: !data.session }
    },
    async resetPassword(email) {
      if (!supabase) throw new Error('尚未配置 Supabase，请检查部署环境变量。')
      setAuthError('')
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + import.meta.env.BASE_URL,
      })
      if (error) {
        const message = readableAuthError(error.message)
        setAuthError(message)
        throw new Error(message)
      }
    },
    async signOut() {
      if (!supabase) return
      const { error } = await supabase.auth.signOut()
      if (error) throw new Error(readableAuthError(error.message))
    },
    async deleteAccount() {
      if (!supabase || !user) throw new Error('当前没有可删除的账号。')
      const { error } = await supabase.functions.invoke('delete-account')
      if (error) throw new Error('账号删除服务尚未部署，请稍后再试。')
      await db.entries.where('ownerId').equals(user.id).delete()
      await db.syncQueue.where('ownerId').equals(user.id).delete()
      await db.syncMeta.delete(user.id)
      await supabase.auth.signOut()
    },
    async syncNow() {
      if (user) await syncUser(user.id)
    },
  }), [authError, loading, session, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth 必须在 AuthProvider 内使用')
  return value
}

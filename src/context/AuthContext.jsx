import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api, getToken, setToken } from '../lib/api.js'

// 真實帳戶系統：JWT token 存 localStorage，用戶資料由後端 /api/auth 提供。
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false) // 有冇檢查完現有 token

  // 開場：如果本機有 token，問後端「我係邊個」（順便驗 token 未過期）
  useEffect(() => {
    if (!getToken()) {
      setReady(true)
      return
    }
    api('/api/auth/me')
      .then((u) => setUser(u))
      .catch(() => setToken(null)) // token 壞咗 / 過期
      .finally(() => setReady(true))
  }, [])

  async function register({ name, email, password }) {
    try {
      const data = await api('/api/auth/register', {
        method: 'POST',
        auth: false,
        body: { name, email, password },
      })
      setToken(data.access_token)
      setUser(data.user)
      return { ok: true, user: data.user }
    } catch (e) {
      return { ok: false, error: e.status ? e.message : '連唔到伺服器，請稍後再試' }
    }
  }

  async function login({ email, password }) {
    try {
      const data = await api('/api/auth/login', {
        method: 'POST',
        auth: false,
        body: { email, password },
      })
      setToken(data.access_token)
      setUser(data.user)
      return { ok: true, user: data.user }
    } catch (e) {
      return { ok: false, error: e.status ? e.message : '連唔到伺服器，請稍後再試' }
    }
  }

  async function forgotPassword(email) {
    try {
      const data = await api('/api/auth/forgot', {
        method: 'POST',
        auth: false,
        body: { email },
      })
      return { ok: true, message: data.message }
    } catch (e) {
      return { ok: false, error: e.status ? e.message : '連唔到伺服器，請稍後再試' }
    }
  }

  async function resetPassword({ email, code, password }) {
    try {
      const data = await api('/api/auth/reset', {
        method: 'POST',
        auth: false,
        body: { email, code, password },
      })
      setToken(data.access_token)
      setUser(data.user)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.status ? e.message : '連唔到伺服器，請稍後再試' }
    }
  }

  function logout() {
    setToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, ready, register, login, logout, forgotPassword, resetPassword }),
    [user, ready],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth 必須喺 AuthProvider 入面用')
  return ctx
}

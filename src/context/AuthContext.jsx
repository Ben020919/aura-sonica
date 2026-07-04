import { createContext, useContext, useEffect, useMemo, useState } from 'react'

// 示範版登入/註冊：帳戶資料存喺瀏覽器 localStorage。
// 日後要真正帳戶系統，只需要換呢個 Provider 入面嘅函式去打後端 API。

const AuthContext = createContext(null)
const USERS_KEY = 'aura.users'
const SESSION_KEY = 'aura.session'

function readUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '{}')
  } catch {
    return {}
  }
}
function writeUsers(u) {
  localStorage.setItem(USERS_KEY, JSON.stringify(u))
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    try {
      const s = localStorage.getItem(SESSION_KEY)
      if (s) setUser(JSON.parse(s))
    } catch {
      /* ignore */
    }
  }, [])

  function persist(u) {
    setUser(u)
    if (u) localStorage.setItem(SESSION_KEY, JSON.stringify(u))
    else localStorage.removeItem(SESSION_KEY)
  }

  function register({ name, email, password }) {
    const users = readUsers()
    const key = email.trim().toLowerCase()
    if (!key || !password) return { ok: false, error: '請填寫 email 同密碼。' }
    if (users[key]) return { ok: false, error: '呢個 email 已經註冊咗喇。' }
    users[key] = { name: name?.trim() || key.split('@')[0], email: key, password }
    writeUsers(users)
    persist({ name: users[key].name, email: key })
    return { ok: true }
  }

  function login({ email, password }) {
    const users = readUsers()
    const key = email.trim().toLowerCase()
    const rec = users[key]
    if (!rec || rec.password !== password)
      return { ok: false, error: 'Email 或密碼唔啱。' }
    persist({ name: rec.name, email: key })
    return { ok: true }
  }

  function logout() {
    persist(null)
  }

  const value = useMemo(
    () => ({ user, register, login, logout }),
    [user],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth 必須喺 AuthProvider 入面用')
  return ctx
}

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api.js'
import { useAuth } from './AuthContext.jsx'

// 收藏 ❤️（用商品 slug）：
//  · 未登入 → 存本機 localStorage
//  · 已登入 → 存後端；由未登入轉登入嗰刻，將本機收藏 merge 上帳戶
const FavoritesContext = createContext(null)
const FAV_KEY = 'aura.favorites'

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) || '[]')
  } catch {
    return []
  }
}
function writeLocal(ids) {
  localStorage.setItem(FAV_KEY, JSON.stringify(ids))
}

export function FavoritesProvider({ children }) {
  const { user } = useAuth()
  const loggedIn = !!user
  const [ids, setIds] = useState(readLocal)

  // 登入狀態一變就同步
  useEffect(() => {
    let cancelled = false
    async function sync() {
      if (loggedIn) {
        const local = readLocal()
        try {
          const data = local.length
            ? await api('/api/favorites/merge', { method: 'POST', body: local })
            : await api('/api/favorites')
          if (cancelled) return
          setIds(data)
          if (local.length) writeLocal([]) // 已上帳戶，清本機
        } catch {
          if (!cancelled) setIds(readLocal())
        }
      } else {
        setIds(readLocal())
      }
    }
    sync()
    return () => {
      cancelled = true
    }
  }, [loggedIn])

  async function toggle(slug) {
    if (!loggedIn) {
      setIds((prev) => {
        const next = prev.includes(slug)
          ? prev.filter((x) => x !== slug)
          : [...prev, slug]
        writeLocal(next)
        return next
      })
      return
    }
    const had = ids.includes(slug)
    // 樂觀更新，之後以後端回傳為準
    setIds((prev) => (had ? prev.filter((x) => x !== slug) : [...prev, slug]))
    try {
      const data = await api(`/api/favorites/${slug}`, {
        method: had ? 'DELETE' : 'POST',
      })
      setIds(data)
    } catch {
      setIds((prev) => (had ? [...prev, slug] : prev.filter((x) => x !== slug)))
    }
  }

  async function remove(slug) {
    if (!loggedIn) {
      setIds((prev) => {
        const next = prev.filter((x) => x !== slug)
        writeLocal(next)
        return next
      })
      return
    }
    setIds((prev) => prev.filter((x) => x !== slug))
    try {
      const data = await api(`/api/favorites/${slug}`, { method: 'DELETE' })
      setIds(data)
    } catch {
      /* 保留樂觀更新 */
    }
  }

  function has(slug) {
    return ids.includes(slug)
  }

  const value = useMemo(
    () => ({ ids, count: ids.length, toggle, has, remove }),
    [ids],
  )
  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites 必須喺 FavoritesProvider 入面用')
  return ctx
}

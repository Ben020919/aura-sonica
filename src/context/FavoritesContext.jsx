import { createContext, useContext, useEffect, useMemo, useState } from 'react'

// 收藏 ❤️：存喺 localStorage，用商品 id。
const FavoritesContext = createContext(null)
const FAV_KEY = 'aura.favorites'

export function FavoritesProvider({ children }) {
  const [ids, setIds] = useState([])

  useEffect(() => {
    try {
      setIds(JSON.parse(localStorage.getItem(FAV_KEY) || '[]'))
    } catch {
      setIds([])
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(FAV_KEY, JSON.stringify(ids))
  }, [ids])

  function toggle(id) {
    setIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }
  function has(id) {
    return ids.includes(id)
  }
  function remove(id) {
    setIds((prev) => prev.filter((x) => x !== id))
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

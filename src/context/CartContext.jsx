import { createContext, useContext, useEffect, useMemo, useState } from 'react'

// 購物車（同收藏 ❤️ 分開）：存本機 localStorage，items = { [key]: qty }。
// key = slug；有選項就 = `${slug}::${variant}::${size}`（例：tee-blue::::M），
// 同一件唔同色／唔同碼分開計。舊格式 `${slug}::${variant}`（只有顏色）一樣讀得返。
// 結帳先要登入；購物車本身唔使登入都用得。
const CartContext = createContext(null)
const CART_KEY = 'aura.cart'

export function cartKey(slug, variant, size) {
  if (!variant && !size) return slug
  return `${slug}::${variant || ''}::${size || ''}`
}

export function parseCartKey(key) {
  const i = key.indexOf('::')
  if (i === -1) return { slug: key, variant: null, size: null }
  const slug = key.slice(0, i)
  const rest = key.slice(i + 2)
  const j = rest.indexOf('::')
  // 冇第二個分隔符 = 舊 key（淨係有顏色）
  if (j === -1) return { slug, variant: rest || null, size: null }
  return { slug, variant: rest.slice(0, j) || null, size: rest.slice(j + 2) || null }
}

function readCart() {
  try {
    const v = JSON.parse(localStorage.getItem(CART_KEY) || '{}')
    return v && typeof v === 'object' ? v : {}
  } catch {
    return {}
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart)

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  }, [items])

  function add(slug, qty = 1, variant = null, size = null) {
    const key = cartKey(slug, variant, size)
    setItems((m) => ({ ...m, [key]: Math.min(99, (m[key] || 0) + qty) }))
  }
  function setQty(key, qty) {
    setItems((m) => {
      const n = { ...m }
      if (qty <= 0) delete n[key]
      else n[key] = Math.min(99, qty)
      return n
    })
  }
  function remove(key) {
    setItems((m) => {
      const n = { ...m }
      delete n[key]
      return n
    })
  }
  function clear() {
    setItems({})
  }

  const count = Object.values(items).reduce((a, b) => a + b, 0)

  const value = useMemo(
    () => ({ items, add, setQty, remove, clear, count }),
    [items, count],
  )
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart 必須喺 CartProvider 入面用')
  return ctx
}

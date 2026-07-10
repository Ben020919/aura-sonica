import { createContext, useContext, useEffect, useMemo, useState } from 'react'

// 購物車（同收藏 ❤️ 分開）：存本機 localStorage，items = { [slug]: qty }。
// 結帳先要登入；購物車本身唔使登入都用得。
const CartContext = createContext(null)
const CART_KEY = 'aura.cart'

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

  function add(slug, qty = 1) {
    setItems((m) => ({ ...m, [slug]: Math.min(99, (m[slug] || 0) + qty) }))
  }
  function setQty(slug, qty) {
    setItems((m) => {
      const n = { ...m }
      if (qty <= 0) delete n[slug]
      else n[slug] = Math.min(99, qty)
      return n
    })
  }
  function remove(slug) {
    setItems((m) => {
      const n = { ...m }
      delete n[slug]
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

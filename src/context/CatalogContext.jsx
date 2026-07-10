import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api.js'

// 商品目錄：由後端 /api/products + /api/categories 讀（即係 Venus 後台改嘅嘢）。
// 將 API 格式對應返舊組件用開嘅欄位名（id=slug、cat=category、en=name_en）。
const CatalogContext = createContext(null)

function mapProduct(p) {
  return {
    id: p.slug,
    slug: p.slug,
    cat: p.category,
    name: p.name,
    en: p.name_en || '',
    price: p.price,
    img: p.img,
    gallery: p.gallery || [],
    tags: p.tags || [],
    note: p.note || '',
    stock: p.stock,
  }
}

function mapCategory(c) {
  return {
    id: c.slug,
    slug: c.slug,
    name: c.name,
    en: c.name_en || '',
    tagline: c.tagline || '',
    cover: c.cover || '',
  }
}

export function CatalogProvider({ children }) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const [ps, cs] = await Promise.all([
        api('/api/products', { auth: false }),
        api('/api/categories', { auth: false }),
      ])
      setProducts(ps.map(mapProduct))
      setCategories(cs.map(mapCategory))
    } catch {
      /* 後端連唔到就留空，唔會 crash */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const value = useMemo(
    () => ({
      products,
      categories,
      loading,
      refresh: load,
      productsByCat: (catId) => products.filter((p) => p.cat === catId),
      findBySlug: (slug) => products.find((p) => p.id === slug),
    }),
    [products, categories, loading],
  )
  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  )
}

export function useCatalog() {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog 必須喺 CatalogProvider 入面用')
  return ctx
}

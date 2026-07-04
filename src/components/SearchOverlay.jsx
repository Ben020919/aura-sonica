import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { PRODUCTS, CATEGORIES } from '../data/products.js'
import ProductCard from './ProductCard.jsx'

const SUGGEST = ['絨面袋', '手機支架', '愛心', '貝殼', '薰衣草', '雲白']

export default function SearchOverlay({ onClose }) {
  const [q, setQ] = useState('')

  const results = useMemo(() => {
    const key = q.trim().toLowerCase()
    if (!key) return []
    return PRODUCTS.filter((p) => {
      const catName = CATEGORIES.find((c) => c.id === p.cat)?.name || ''
      const hay = [p.name, p.en, catName, ...p.tags].join(' ').toLowerCase()
      return hay.includes(key)
    })
  }, [q])

  return (
    <motion.div
      className="search-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="search-box">
        <div className="search-input-wrap">
          <Search size={26} color="var(--aura-300)" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搵下你想要嘅寶物…"
            onKeyDown={(e) => e.key === 'Escape' && onClose()}
          />
          <button className="icon-btn" onClick={onClose} aria-label="關閉搜尋">
            <X size={22} />
          </button>
        </div>

        {!q && (
          <div className="search-hint">
            {SUGGEST.map((s) => (
              <button key={s} onClick={() => setQ(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        {q && results.length > 0 && (
          <div className="search-results">
            {results.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {q && results.length === 0 && (
          <div className="search-empty">
            海面暫時搵唔到「{q}」，試下其他關鍵字？
          </div>
        )}
      </div>
    </motion.div>
  )
}

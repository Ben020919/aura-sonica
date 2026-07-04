import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import Reveal from '../components/Reveal.jsx'
import ProductCard from '../components/ProductCard.jsx'
import { CATEGORIES, productsByCat } from '../data/products.js'

export default function Shop() {
  // 預設全部分類都展開（客戶要求一入嚟就見到所有商品）。撳標題可收合/再展開。
  const [open, setOpen] = useState(() =>
    Object.fromEntries(CATEGORIES.map((c) => [c.id, true])),
  )

  function toggle(id) {
    setOpen((o) => ({ ...o, [id]: !o[id] }))
  }

  return (
    <section className="page shop-page" id="shop">
      <div className="section-inner">
        <div className="shop-head">
          <Reveal>
            <div className="eyebrow" style={{ marginBottom: '0.8rem' }}>
              Shop the Collection
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <h2>Aura 的貝殼小店</h2>
          </Reveal>
          <Reveal delay={0.3}>
            <p
              style={{
                color: 'var(--ink-soft)',
                marginTop: '0.8rem',
                fontFamily: 'var(--serif-tc)',
                fontWeight: 300,
              }}
            >
              撳一下分類標題,就可以進去看看每一件寶物。
            </p>
          </Reveal>
        </div>

        {CATEGORIES.map((cat, i) => {
          const items = productsByCat(cat.id)
          const isOpen = !!open[cat.id]
          return (
            <Reveal key={cat.id} delay={i * 0.1}>
              <div className={`category${isOpen ? ' open' : ''}`}>
                <button
                  className="category-header"
                  onClick={() => toggle(cat.id)}
                  aria-expanded={isOpen}
                >
                  <img className="bg" src={cat.cover} alt="" aria-hidden />
                  <div className="category-title">
                    <div className="en">{cat.en}</div>
                    <div className="zh">{cat.name}</div>
                    <div className="tagline">{cat.tagline}</div>
                  </div>
                  <div className="category-toggle">
                    <span>{items.length} 件 · {isOpen ? '收起' : '展開'}</span>
                    <ChevronDown className="chev" size={22} />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      className="category-body"
                      key="body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="product-grid">
                        {items.map((p) => (
                          <ProductCard key={p.id} product={p} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}

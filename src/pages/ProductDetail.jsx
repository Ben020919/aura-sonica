import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, Heart, Minus, Plus } from 'lucide-react'
import { useCatalog } from '../context/CatalogContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useFavorites } from '../context/FavoritesContext.jsx'

export default function ProductDetail() {
  const { slug } = useParams()
  const { findBySlug, loading } = useCatalog()
  const { add } = useCart()
  const { has, toggle } = useFavorites()
  const product = findBySlug(slug)
  const [idx, setIdx] = useState(0)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [variant, setVariant] = useState(null) // 顏色等選項（有先顯示）

  if (loading) {
    return (
      <section className="page">
        <p className="muted" style={{ textAlign: 'center', padding: '5rem 0' }}>載入中… 🐚</p>
      </section>
    )
  }
  if (!product) {
    return (
      <section className="page">
        <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
          <p style={{ color: 'var(--ink-soft)', marginBottom: '1rem' }}>搵唔到呢件寶物。</p>
          <Link to="/shop" style={{ color: 'var(--sea-700)', fontWeight: 600 }}>← 返商店</Link>
        </div>
      </section>
    )
  }

  const gallery = product.gallery?.length ? product.gallery : [product.img]
  const fav = has(product.id)
  const variants = product.variants || []
  const chosen = variants.length ? variant || variants[0] : null
  function addToCart() {
    add(product.id, qty, chosen)
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  return (
    <section className="page pdp">
      <div className="pdp-inner">
        <Link to="/shop" className="pdp-back">
          <ChevronLeft size={16} /> 返商店
        </Link>

        <div className="pdp-grid">
          <div className="pdp-gallery">
            <motion.div
              className="pdp-main"
              key={idx}
              initial={{ opacity: 0.35 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
            >
              <img src={gallery[idx]} alt={product.name} />
            </motion.div>
            {gallery.length > 1 && (
              <div className="pdp-thumbs">
                {gallery.map((g, i) => (
                  <button
                    key={i}
                    className={`pdp-thumb${i === idx ? ' on' : ''}`}
                    onClick={() => setIdx(i)}
                    aria-label={`相片 ${i + 1}`}
                  >
                    <img src={g} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pdp-info">
            {product.en && <div className="pdp-en">{product.en}</div>}
            <h1 className="pdp-name">{product.name}</h1>
            <div className="pdp-price">
              <small>HKD</small> {product.price}
            </div>
            {product.note && <p className="pdp-note">{product.note}</p>}

            {variants.length > 0 && (
              <div className="pdp-qty" style={{ flexWrap: 'wrap' }}>
                <span className="pdp-qty-label">顏色</span>
                {variants.map((v) => {
                  const on = chosen === v
                  return (
                    <button
                      key={v}
                      type="button"
                      className="pill-action"
                      onClick={() => setVariant(v)}
                      aria-pressed={on}
                      style={
                        on
                          ? { background: 'var(--sea-700, #2f4d73)', color: '#fff', borderColor: 'var(--sea-700, #2f4d73)' }
                          : undefined
                      }
                    >
                      {v}
                    </button>
                  )
                })}
                <span style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', marginLeft: 4 }}>One Size</span>
              </div>
            )}

            <div className="pdp-qty">
              <span className="pdp-qty-label">數量</span>
              <button className="qty-btn" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="減少">
                <Minus size={14} />
              </button>
              <span className="pdp-qtynum">{qty}</span>
              <button className="qty-btn" onClick={() => setQty((q) => q + 1)} aria-label="增加">
                <Plus size={14} />
              </button>
            </div>

            {product.stock <= 0 ? (
              <button className="btn pdp-add" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                暫時售罄
              </button>
            ) : (
              <button className="btn pdp-add" onClick={addToCart}>
                {added ? '已加入購物車 ✓' : '加入購物車'}
              </button>
            )}

            <button className={`pdp-fav${fav ? ' on' : ''}`} onClick={() => toggle(product.id)}>
              <Heart size={15} fill={fav ? 'currentColor' : 'none'} /> {fav ? '已收藏' : '加入收藏'}
            </button>

            <p className="pdp-ship">
              🚚 順豐到付 · 落單後 Venus 會聯絡你安排商品付款（FPS／轉數快）🌊
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

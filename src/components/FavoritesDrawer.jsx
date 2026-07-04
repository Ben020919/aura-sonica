import { motion } from 'framer-motion'
import { X, Trash2, Heart } from 'lucide-react'
import { useFavorites } from '../context/FavoritesContext.jsx'
import { PRODUCTS } from '../data/products.js'

export default function FavoritesDrawer({ onClose }) {
  const { ids, remove } = useFavorites()
  const items = PRODUCTS.filter((p) => ids.includes(p.id))
  const total = items.reduce((s, p) => s + p.price, 0)

  return (
    <div className="overlay" onClick={onClose} style={{ justifyContent: 'flex-end', padding: 0 }}>
      <motion.aside
        className="drawer"
        onClick={(e) => e.stopPropagation()}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="drawer-head">
          <h3>
            <Heart size={18} style={{ marginRight: 8, verticalAlign: -2 }} />
            我的收藏
          </h3>
          <button className="icon-btn" onClick={onClose} aria-label="關閉">
            <X size={20} />
          </button>
        </div>

        <div className="drawer-body">
          {items.length === 0 ? (
            <div className="drawer-empty">
              仲未收藏任何寶物 🐚
              <br />
              喺商店撳一下 ❤️，佢哋就會游到呢度。
            </div>
          ) : (
            <>
              {items.map((p) => (
                <div className="fav-row" key={p.id}>
                  <img src={p.img} alt={p.name} />
                  <div className="meta">
                    <div className="n">{p.name}</div>
                    <div className="p">HKD {p.price}</div>
                  </div>
                  <button
                    className="rm"
                    onClick={() => remove(p.id)}
                    aria-label="移除"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '1.4rem',
                  fontFamily: 'var(--serif)',
                  color: 'var(--sea-700)',
                }}
              >
                <span>合計</span>
                <span style={{ fontFamily: 'var(--cormorant)', fontSize: '1.4rem' }}>
                  HKD {total}
                </span>
              </div>
              <button
                className="btn"
                style={{ width: '100%', justifyContent: 'center', marginTop: '1.2rem' }}
                onClick={() => alert('付款功能稍後開放 🌊\n（依家可以先收藏心水寶物）')}
              >
                結帳（稍後開放）
              </button>
            </>
          )}
        </div>
      </motion.aside>
    </div>
  )
}

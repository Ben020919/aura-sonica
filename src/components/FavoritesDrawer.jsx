import { motion } from 'framer-motion'
import { X, Trash2, Heart, ShoppingBag } from 'lucide-react'
import { useFavorites } from '../context/FavoritesContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useCatalog } from '../context/CatalogContext.jsx'

// 收藏 = wishlist（心心）。購物同結帳係另一個 CartDrawer。
export default function FavoritesDrawer({ onClose }) {
  const { ids, remove } = useFavorites()
  const { add } = useCart()
  const { products } = useCatalog()
  const items = products.filter((p) => ids.includes(p.id))

  return (
    <div
      className="overlay"
      onClick={onClose}
      style={{ justifyContent: 'flex-end', padding: 0 }}
    >
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
            items.map((p) => (
              <div className="fav-row" key={p.id}>
                <img src={p.img} alt={p.name} />
                <div className="meta">
                  <div className="n">{p.name}</div>
                  <div className="p">HKD {p.price}</div>
                  <button
                    onClick={() => add(p.id, 1)}
                    style={{
                      marginTop: 8,
                      padding: '0.4em 0.9em',
                      fontSize: '0.8rem',
                      borderRadius: 999,
                      border: '1px solid rgba(127,169,214,0.6)',
                      background: 'transparent',
                      color: 'var(--sea-700)',
                      cursor: 'pointer',
                    }}
                  >
                    <ShoppingBag size={13} style={{ marginRight: 5, verticalAlign: -2 }} />
                    加入購物車
                  </button>
                </div>
                <button className="rm" onClick={() => remove(p.id)} aria-label="移除">
                  <Trash2 size={17} />
                </button>
              </div>
            ))
          )}
        </div>
      </motion.aside>
    </div>
  )
}

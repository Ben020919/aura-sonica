import { Heart } from 'lucide-react'
import { motion } from 'framer-motion'
import { useFavorites } from '../context/FavoritesContext.jsx'

export default function ProductCard({ product }) {
  const { has, toggle } = useFavorites()
  const active = has(product.id)

  return (
    <motion.article
      className="product-card"
      layout
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="product-media">
        <img src={product.img} alt={product.name} loading="lazy" />
        <button
          className={`fav-btn${active ? ' active' : ''}`}
          onClick={() => toggle(product.id)}
          aria-label={active ? '移除收藏' : '加入收藏'}
          title={active ? '移除收藏' : '加入收藏'}
        >
          <Heart size={18} fill={active ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="product-info">
        <span className="en">{product.en}</span>
        <span className="name">{product.name}</span>
        <p className="note">{product.note}</p>
        <div className="tag-row">
          {product.tags.slice(0, 3).map((t) => (
            <span className="tag" key={t}>
              {t}
            </span>
          ))}
        </div>
        <div className="price-row">
          <span className="price">
            <small>HKD</small>
            {product.price}
          </span>
          <button
            className="add-btn"
            onClick={() => toggle(product.id)}
            title="加入收藏（付款功能稍後開放）"
          >
            {active ? '已收藏' : '收藏'}
          </button>
        </div>
      </div>
    </motion.article>
  )
}

import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal.jsx'
import { useCatalog } from '../context/CatalogContext.jsx'

// 每件產品一條 lookbook：一行相（3 張，公仔 4 張）+ 名 + 價 + Shop Now
function Lookbook({ product }) {
  const gallery = (product.gallery?.length ? product.gallery : [product.img]).slice(0, 4)
  return (
    <Reveal delay={0.05}>
      <article className="lookbook">
        <div className={`lookbook-photos count-${gallery.length}`}>
          {gallery.map((g, i) => (
            <Link key={i} to={`/product/${product.id}`} className="lookbook-photo" aria-label={product.name}>
              <img src={g} alt={product.name} loading="lazy" />
            </Link>
          ))}
        </div>
        <div className="lookbook-foot">
          <div className="lookbook-meta">
            {product.en && <span className="lookbook-en">{product.en}</span>}
            <span className="lookbook-name">{product.name}</span>
            <span className="lookbook-price">
              <small>HKD</small> {product.price}
            </span>
          </div>
          <Link to={`/product/${product.id}`} className="lookbook-shop">
            Shop Now →
          </Link>
        </div>
      </article>
    </Reveal>
  )
}

export default function Shop() {
  const { products, loading } = useCatalog()

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
            <h2>Aura Sonica @ Store</h2>
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
              每一件，都是從忘聲海帶回來的寶物。
            </p>
          </Reveal>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--ink-soft)', padding: '3rem 0' }}>
            載入商品中… 🐚
          </p>
        ) : products.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--ink-soft)', padding: '3rem 0' }}>
            商品即將上架 🐚
          </p>
        ) : (
          <div className="lookbook-list">
            {products.map((p) => (
              <Lookbook key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal.jsx'
import { useCatalog } from '../context/CatalogContext.jsx'

// 呢啲分類用「細卡 grid」：list 頁一件一張圖，撳入去先睇晒成套相
const CARD_SECTIONS = [
  { cat: 'stationery', title: 'Stationery Items' },
]
const CARD_CATS = CARD_SECTIONS.map((s) => s.cat)

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

// 細卡：一張圖 + 名 + 顏色（eyebrow）+ 價
function ProductCard({ product }) {
  const sub = product.en && product.en !== product.name ? product.en : null
  return (
    <Link to={`/product/${product.id}`} className="pcard" aria-label={product.name}>
      <div className="pcard-photo">
        <img src={product.img} alt={product.name} loading="lazy" />
      </div>
      {sub && <span className="pcard-sub">{sub}</span>}
      <span className="pcard-name">{product.name}</span>
      <span className="pcard-price">
        <small>HKD</small> {product.price}
      </span>
    </Link>
  )
}

export default function Shop() {
  const { products, loading } = useCatalog()
  const looks = products.filter((p) => !CARD_CATS.includes(p.cat))

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
          <>
            <div className="lookbook-list">
              {looks.map((p) => (
                <Lookbook key={p.id} product={p} />
              ))}
            </div>

            {CARD_SECTIONS.map((sec) => {
              const items = products.filter((p) => p.cat === sec.cat)
              if (!items.length) return null
              return (
                <div key={sec.cat} className="pgrid-block">
                  <Reveal>
                    <div className="eyebrow pgrid-title">{sec.title}</div>
                  </Reveal>
                  <Reveal delay={0.1}>
                    <div className="pgrid">
                      {items.map((p) => (
                        <ProductCard key={p.id} product={p} />
                      ))}
                    </div>
                  </Reveal>
                </div>
              )
            })}
          </>
        )}
      </div>
    </section>
  )
}

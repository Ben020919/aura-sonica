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
      <span className="pcard-cta lookbook-shop">Shop Now →</span>
    </Link>
  )
}

// 跟後台「擺喺邊（Store 排序）」嘅次序砌版塊：
// - 普通產品：連住嘅幾件合埋一條 lookbook-list
// - 細卡分類（例：文具）：成個分類合埋一個 grid，位置 = 該分類排最前嗰件嘅位置
function buildBlocks(products) {
  const blocks = []
  const cardBlocks = new Map()
  for (const p of products) {
    if (CARD_CATS.includes(p.cat)) {
      let block = cardBlocks.get(p.cat)
      if (!block) {
        block = {
          kind: 'cards',
          cat: p.cat,
          title: CARD_SECTIONS.find((s) => s.cat === p.cat).title,
          items: [],
        }
        cardBlocks.set(p.cat, block)
        blocks.push(block)
      }
      block.items.push(p)
    } else {
      const last = blocks[blocks.length - 1]
      if (last?.kind === 'looks') last.items.push(p)
      else blocks.push({ kind: 'looks', items: [p] })
    }
  }
  return blocks
}

export default function Shop() {
  const { products, loading } = useCatalog()
  const blocks = buildBlocks(products)

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
          blocks.map((block, i) =>
            block.kind === 'looks' ? (
              <div key={`looks-${i}`} className="lookbook-list">
                {block.items.map((p) => (
                  <Lookbook key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div key={`cards-${block.cat}`} className="pgrid-block">
                <Reveal>
                  <div className="eyebrow pgrid-title">{block.title}</div>
                </Reveal>
                <Reveal delay={0.1}>
                  <div className="pgrid">
                    {block.items.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                </Reveal>
              </div>
            ),
          )
        )}
      </div>
    </section>
  )
}

import Reveal from '../components/Reveal.jsx'

// Venus 原創畫作 Gallery：先放兩張，其他 design 日後再調。
const WORKS = [
  { src: '/products/gallery-1.jpeg', alt: 'AURA Sonica — 原創畫作' },
  { src: '/products/gallery-2.jpeg', alt: 'AURA Sonica — 原創畫作系列' },
]

export default function Gallery() {
  return (
    <section className="page shop-page gallery-page" id="gallery">
      <div className="section-inner">
        <div className="shop-head">
          <Reveal>
            <div className="eyebrow" style={{ marginBottom: '0.8rem' }}>
              The Original Artworks
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <h2>Gallery</h2>
          </Reveal>
        </div>

        <Reveal delay={0.25}>
          <div className="gallery-grid">
            {WORKS.map((w, i) => (
              <img
                key={i}
                className="gallery-art"
                src={w.src}
                alt={w.alt}
                loading="lazy"
              />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

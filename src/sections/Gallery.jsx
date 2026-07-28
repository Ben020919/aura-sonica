import Reveal from '../components/Reveal.jsx'

// Venus 原創畫作 Gallery：先放兩張，其他 design 日後再調。
const WORKS = [
  { src: '/products/gallery-1.jpeg', alt: 'AURA Sonica — 原創畫作' },
  { src: '/products/gallery-2.jpeg', alt: 'AURA Sonica — 原創畫作系列' },
]

export default function Gallery() {
  return (
    <section className="page shop-page" id="gallery">
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
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '2rem',
              justifyContent: 'center',
              alignItems: 'flex-start',
              maxWidth: 1000,
              margin: '2.5rem auto 0',
            }}
          >
            {WORKS.map((w, i) => (
              <div key={i} style={{ flex: '1 1 380px', maxWidth: 460 }}>
                <img
                  src={w.src}
                  alt={w.alt}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    borderRadius: 14,
                    boxShadow: '0 18px 50px rgba(60, 80, 120, 0.14)',
                  }}
                />
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

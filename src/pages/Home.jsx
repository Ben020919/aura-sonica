import { motion } from 'framer-motion'
import Landing from '../sections/Landing.jsx'
import Welcome from '../sections/Welcome.jsx'
import Note from '../sections/Note.jsx'

function Marquee() {
  const items = Array.from({ length: 6 }, (_, i) => i)
  return (
    <div className="marquee" aria-hidden>
      <div className="track">
        {items.map((i) => (
          <span key={`a${i}`}>Aura</span>
        ))}
        {items.map((i) => (
          <span key={`b${i}`}>Aura</span>
        ))}
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="brand">AURA_Sonica</div>
      <div className="tagline">Listen , to the wave within</div>
      <div className="small">
        原創 IP · 情緒療癒 · 自我成長
        <br />
        © {new Date().getFullYear()} AURA_Sonica
      </div>
    </footer>
  )
}

// 主頁 = 封面（Page 1 → Page 5 → Page 6），其餘頁面靠頂部牛仔標籤入去。
export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Landing />
      <Welcome />
      <Note />
      <Marquee />
      <Footer />
    </motion.div>
  )
}

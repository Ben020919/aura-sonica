import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

// 星星裝飾位置（模仿封面 Page 1）
const STARS = [
  { top: '8%', left: '6%', size: 46, delay: 0 },
  { top: '16%', left: '82%', size: 64, delay: 0.4 },
  { top: '30%', left: '24%', size: 26, delay: 0.8 },
  { top: '62%', left: '10%', size: 70, delay: 0.2 },
  { top: '70%', left: '80%', size: 90, delay: 0.6 },
  { top: '44%', left: '92%', size: 30, delay: 1 },
  { top: '84%', left: '40%', size: 34, delay: 0.5 },
  { top: '22%', left: '52%', size: 20, delay: 1.2 },
]

export default function Landing() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], [0, -120])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08])

  return (
    <section className="landing" id="top" ref={ref}>
      <div className="stars-deco" aria-hidden>
        {STARS.map((s, i) => (
          <motion.span
            key={i}
            style={{ top: s.top, left: s.left }}
            initial={{ opacity: 0, scale: 0.4, rotate: -20 }}
            animate={{ opacity: 0.7, scale: 1, rotate: 0 }}
            transition={{
              duration: 1.4,
              delay: s.delay,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <motion.span
              style={{ display: 'inline-block' }}
              animate={{ y: [0, -12, 0] }}
              transition={{
                duration: 5 + i,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Star size={s.size} />
            </motion.span>
          </motion.span>
        ))}
      </div>

      <motion.div style={{ y, opacity, scale, zIndex: 2 }}>
        <motion.h1
          initial={{ opacity: 0, y: 40, filter: 'blur(14px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        >
          AURA<span style={{ color: 'var(--aura-300)' }}>_</span>Sonica
        </motion.h1>

        <motion.div
          className="tagline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.6 }}
        >
          Listen , to the wave within
        </motion.div>

        <motion.div
          className="subline"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.9 }}
        >
          原創 IP · 情緒療癒 · 自我成長
          <br />
          Original IP · Emotional Healing · Self Growth
        </motion.div>

        <motion.button
          type="button"
          className="enter"
          onClick={() =>
            document
              .getElementById('welcome')
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.3 }}
          whileHover={{ letterSpacing: '0.55em' }}
        >
          Enter
          <span className="line" />
        </motion.button>
      </motion.div>
    </section>
  )
}

function Star({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="currentColor">
      <path d="M50 2 C54 34 66 46 98 50 C66 54 54 66 50 98 C46 66 34 54 2 50 C34 46 46 34 50 2 Z" />
    </svg>
  )
}

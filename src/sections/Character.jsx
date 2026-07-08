import { motion } from 'framer-motion'
import Reveal from '../components/Reveal.jsx'
import MagDecor from '../components/MagDecor.jsx'

// 主角：左邊全部係字，右邊 full 圖（同關於/故事左右交替）。
export default function Character() {
  return (
    <section className="page clean-page">
      <div className="clean-split reverse">
        <div className="text-side">
          <MagDecor variant="aura" />
          <Reveal>
            <div className="kicker">The Original IP</div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="script-title">
              <span className="pre">My Name is</span>
              <span className="big">Aura</span>
            </div>
          </Reveal>
          <Reveal delay={0.24}>
            <p className="drop">她住在忘聲海最深的貝殼裡。</p>
          </Reveal>
          <Reveal delay={0.34}>
            <p>
              收集每一個沒說出口的聲音，把它們釀成一顆一顆的珍珠。
              <br />
              她不說話，只是靜靜聽——
              <br />
              聽你今天，過得好不好。
            </p>
          </Reveal>
          <Reveal delay={0.44}>
            <p className="en">
              She lives in the deepest shell of the silent sea,
              <br />
              gathering every word left unspoken and turning them,
              <br />
              slowly, into pearls.
            </p>
          </Reveal>
        </div>

        <motion.div
          className="photo-full"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <img src="/products/12.jpeg" alt="Aura — 原創 IP 角色" />
        </motion.div>
      </div>
    </section>
  )
}

import { motion } from 'framer-motion'
import Reveal from '../components/Reveal.jsx'
import MagDecor from '../components/MagDecor.jsx'

// 關於：左邊 full 圖，右邊全部係字。
export default function About() {
  return (
    <section className="page clean-page">
      <div className="clean-split">
        <motion.div
          className="photo-full"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <img src="/products/11.jpeg" alt="Listen to the wave within" />
        </motion.div>

        <div className="text-side">
          <MagDecor variant="about" />
          <Reveal>
            <div className="kicker">A Study in Softness</div>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="clean-title">Aura_Sonica</h1>
          </Reveal>
          <Reveal delay={0.18}>
            <div className="rule" />
          </Reveal>
          <Reveal delay={0.24}>
            <p className="drop">
              是分享情緒療癒、自我成長、
              <br />
              美學生活與精神探索的品牌。
            </p>
          </Reveal>
          <Reveal delay={0.34}>
            <p>
              連結同頻的靈魂，
              <br />
              陪伴每一個正在尋找自己、正在成為自己的光的人。
              <br />
              在這片忘聲海裡，你不需要用力發光
              <br />
              ——你只需要記得，你本來就是光。
            </p>
          </Reveal>
          <Reveal delay={0.44}>
            <p className="en">
              A brand sharing emotional healing, self-growth
              <br />
              and quiet spiritual exploration
              <br />
              —accompanying everyone who is becoming their own light.
            </p>
          </Reveal>
          <Reveal delay={0.52}>
            <div className="sign">— AURA_Sonica</div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

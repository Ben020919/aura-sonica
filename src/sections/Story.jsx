import { motion } from 'framer-motion'
import Reveal from '../components/Reveal.jsx'
import MagDecor from '../components/MagDecor.jsx'

// 《第一顆珍珠》故事文字 —— Venus 可以喺呢度換成完整原文。
const STORY = `藍天很暗的那天，Aura 沒有打開她的貝殼。
她把自己蜷成一顆小小的沙，讓潮水一次又一次，
問她：「你今天，還好嗎？」

她沒有回答，只是把那些沒說出口的話，
一句一句，吞進肚裡。
很久很久以後，那些話被海水磨得很圓、
很亮——變成了她的第一顆珍珠。

原來我們吞下的那些委屈，有一天，也會成為光。`

// 故事：左邊 full 圖，右邊全部係字。圖同文字同一時間一齊淡入升起。
export default function Story() {
  return (
    <section className="page clean-page">
      <div className="clean-split">
        <motion.div
          className="photo-full"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0, ease: [0.22, 1, 0.36, 1] }}
        >
          <img src="/products/7.jpeg" alt="第一顆珍珠" />
        </motion.div>

        <div className="text-side">
          <MagDecor variant="story" />
          <Reveal delay={0}>
            <div className="kicker">A Story from the Sea</div>
          </Reveal>
          <Reveal delay={0}>
            <h1 className="clean-title serif-tc">《第一顆珍珠》</h1>
          </Reveal>
          <Reveal delay={0}>
            <div className="rule" />
          </Reveal>
          <Reveal delay={0}>
            <p className="story-text">{STORY}</p>
          </Reveal>
          <Reveal delay={0}>
            <div className="sign">— 寫給每一個，把話吞進海裡的你</div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

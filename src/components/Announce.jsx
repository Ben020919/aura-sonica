import { useEffect } from 'react'

// 頂部公告橫幅：不停由右向左捲，捲完接返轉頭（無縫）。
// 文字 / 字大細 / 速度 / 顏色全部由後台改（/api/settings）。
// 無縫做法同 Home 個 Marquee 一樣：同樣內容擺兩份，track 捲到 -50% 就啱啱接得返上。
const REPEAT = 6 // 一份入面重覆幾多次（要闊過最闊嘅螢幕，唔係會見到空隙）

export default function Announce({ settings }) {
  const text = settings.announce_text.trim()
  const fontSize = settings.announce_font_size
  // 條 bar 嘅高度跟字大細走，咁後台調大字都唔會逼爆
  const height = Math.round(fontSize * 2.6)

  // 有橫幅嗰陣，內文要多讓返條 bar 嘅高度（見 index.css 嘅 .has-announce）
  useEffect(() => {
    document.body.classList.add('has-announce')
    document.body.style.setProperty('--announce-h', `${height}px`)
    return () => {
      document.body.classList.remove('has-announce')
      document.body.style.removeProperty('--announce-h')
    }
  }, [height])

  return (
    <div
      className="announce"
      role="note"
      aria-label={text}
      style={{
        '--announce-font': `${fontSize}px`,
        '--announce-speed': `${settings.announce_speed}s`,
        '--announce-bg': settings.announce_bg,
        '--announce-color': settings.announce_color,
      }}
    >
      <div className="announce-track" aria-hidden="true">
        {[0, 1].map((half) => (
          <div className="announce-half" key={half}>
            {Array.from({ length: REPEAT }, (_, i) => (
              <span className="announce-item" key={i}>
                {text}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

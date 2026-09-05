import { useEffect, useLayoutEffect, useRef, useState } from 'react'

// 頂部公告橫幅：不停由右向左捲，捲完接返轉頭（無縫）。
// 文字 / 字大細 / 速度 / 顏色全部由後台改（/api/settings）。
// 無縫做法同 Home 個 Marquee 一樣：同樣內容擺兩份，track 捲到 -50% 就啱啱接得返上。
const REPEAT = 6 // 一份入面重覆幾多次（要闊過最闊嘅螢幕，唔係會見到空隙）

// 條 bar 嘅高度跟字大細走，咁後台調大字都唔會逼爆個 nav
export function announceHeight(fontSize) {
  return Math.round(fontSize * 2.6)
}

// 淨係個橫幅本身（冇副作用），後台預覽都係用呢個，所以預覽同真嘢一模一樣
export function AnnounceBar({ settings, style }) {
  const text = settings.announce_text.trim() || '（未有文字）'
  const fontSize = Number(settings.announce_font_size)
  const speed = Number(settings.announce_speed)
  const trackRef = useRef(null)
  const [duration, setDuration] = useState(speed)

  // 「秒數」= 文字行走一個螢幕闊度要幾多秒。
  // 唔可以直接攞嚟做動畫時間：track 闊度會跟文字長短變，
  // 咁打長咗文字就會無端端變快。所以量返實際闊度再換算。
  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return
    const measure = () => {
      const half = track.scrollWidth / 2 // 兩份一樣，行一份就係一圈
      const screen = track.parentElement?.clientWidth || 0
      if (half > 0 && screen > 0) setDuration(speed * (half / screen))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(track)
    if (track.parentElement) ro.observe(track.parentElement)
    return () => ro.disconnect()
  }, [speed, text, fontSize])

  return (
    <div
      className="announce"
      role="note"
      aria-label={text}
      style={{
        '--announce-h': `${announceHeight(fontSize)}px`,
        '--announce-font': `${fontSize}px`,
        '--announce-speed': `${duration}s`,
        '--announce-bg': settings.announce_bg,
        '--announce-color': settings.announce_color,
        ...style,
      }}
    >
      <div className="announce-track" ref={trackRef} aria-hidden="true">
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

export default function Announce({ settings }) {
  const height = announceHeight(Number(settings.announce_font_size))

  // 有橫幅嗰陣，內文要多讓返條 bar 嘅高度（見 index.css 嘅 .has-announce）
  useEffect(() => {
    document.body.classList.add('has-announce')
    document.body.style.setProperty('--announce-h', `${height}px`)
    return () => {
      document.body.classList.remove('has-announce')
      document.body.style.removeProperty('--announce-h')
    }
  }, [height])

  return <AnnounceBar settings={settings} />
}

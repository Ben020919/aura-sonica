import { useEffect } from 'react'

// 頂部公告橫幅：不停由右向左捲，捲完接返轉頭（無縫）。
// 做法同 Home 個 Marquee 一樣：同樣內容擺兩份，track 捲到 -50% 就啱啱接得返上。
const MESSAGE = '僅適用於網站購買 : 購物滿港幣200元即享免運費'
const REPEAT = 6 // 一份入面重覆幾多次（要闊過最闊嘅螢幕，唔係會見到空隙）

export default function Announce() {
  // 有橫幅嗰陣，內文要多讓返條 bar 嘅高度（見 index.css 嘅 .has-announce）
  useEffect(() => {
    document.body.classList.add('has-announce')
    return () => document.body.classList.remove('has-announce')
  }, [])

  return (
    <div className="announce" role="note" aria-label={MESSAGE}>
      <div className="announce-track" aria-hidden="true">
        {[0, 1].map((half) => (
          <div className="announce-half" key={half}>
            {Array.from({ length: REPEAT }, (_, i) => (
              <span className="announce-item" key={i}>
                {MESSAGE}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

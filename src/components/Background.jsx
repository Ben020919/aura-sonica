import { useMemo } from 'react'

// 固定喺畫面最底嘅動態海洋背景 + 漂浮氣泡 / 星星。
// 令靜態相都好似浸喺會流動嘅海入面。
export default function Background() {
  const floaters = useMemo(() => {
    const items = []
    for (let i = 0; i < 26; i++) {
      const isStar = i % 5 === 0
      const size = isStar ? 10 + (i % 4) * 4 : 6 + (i % 6) * 4
      items.push({
        id: i,
        isStar,
        left: (i * 37) % 100,
        size,
        duration: 16 + ((i * 7) % 20),
        delay: -((i * 3) % 22),
      })
    }
    return items
  }, [])

  return (
    <>
      <div className="ocean-bg" aria-hidden />
      <div className="floaters" aria-hidden>
        {floaters.map((f) => (
          <span
            key={f.id}
            className={`floater${f.isStar ? ' star' : ''}`}
            style={{
              left: `${f.left}%`,
              width: f.isStar ? 'auto' : `${f.size}px`,
              height: f.isStar ? 'auto' : `${f.size}px`,
              fontSize: f.isStar ? `${f.size}px` : undefined,
              animationDuration: `${f.duration}s`,
              animationDelay: `${f.delay}s`,
            }}
          >
            {f.isStar ? '✦' : ''}
          </span>
        ))}
      </div>
    </>
  )
}

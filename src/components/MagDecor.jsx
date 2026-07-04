// 雜誌 editorial 散落裝飾 —— 星星 + 柔軟花朵（AURA 藍 / 薰衣草），
// 仿參考 lookbook 嗰種散落 motif。純裝飾。
const BLUE = '#a9c7e8'
const BLUE2 = '#c6dbf1'
const LAV = '#c3b4e6'

function Star({ s, c }) {
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" fill={c}>
      <path d="M50 2 C54 34 66 46 98 50 C66 54 54 66 50 98 C46 66 34 54 2 50 C34 46 46 34 50 2 Z" />
    </svg>
  )
}

function Blossom({ s, c }) {
  return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse
          key={a}
          cx="50"
          cy="27"
          rx="14"
          ry="21"
          fill={c}
          transform={`rotate(${a} 50 50)`}
        />
      ))}
      <circle cx="50" cy="50" r="8" fill="#fff" opacity="0.85" />
    </svg>
  )
}

// 每頁一套散落位置（疏落、輕量點綴；放喺文字一邊）
const PRESETS = {
  about: [
    { t: 8, l: 82, s: 26, k: 'star', c: BLUE, o: 0.7 },
    { t: 20, l: 95, s: 15, k: 'star', c: LAV, o: 0.8 },
    { t: 54, l: 92, s: 30, k: 'star', c: BLUE, o: 0.5 },
    { t: 80, l: 84, s: 18, k: 'star', c: LAV, o: 0.65 },
    { t: 90, l: 16, s: 20, k: 'star', c: BLUE2, o: 0.55 },
  ],
  aura: [
    { t: 6, l: 10, s: 28, k: 'blossom', c: LAV, o: 0.7 },
    { t: 18, l: 86, s: 18, k: 'star', c: BLUE, o: 0.7 },
    { t: 58, l: 90, s: 24, k: 'star', c: LAV, o: 0.55 },
    { t: 86, l: 16, s: 22, k: 'star', c: BLUE2, o: 0.6 },
    { t: 44, l: 6, s: 15, k: 'star', c: BLUE, o: 0.65 },
  ],
  story: [
    { t: 14, l: 88, s: 24, k: 'star', c: LAV, o: 0.7 },
    { t: 34, l: 95, s: 15, k: 'star', c: BLUE, o: 0.75 },
    { t: 66, l: 90, s: 22, k: 'star', c: BLUE2, o: 0.55 },
    { t: 24, l: 60, s: 16, k: 'star', c: LAV, o: 0.6 },
    { t: 78, l: 74, s: 20, k: 'star', c: BLUE, o: 0.55 },
  ],
}

export default function MagDecor({ variant = 'about' }) {
  const items = PRESETS[variant] || PRESETS.about
  return (
    <div className="mag-scatter" aria-hidden>
      {items.map((d, i) => (
        <span
          key={i}
          className="mag-motif"
          style={{
            top: `${d.t}%`,
            left: `${d.l}%`,
            opacity: d.o,
            transform: `rotate(${d.r || 0}deg)`,
          }}
        >
          {d.k === 'blossom' ? (
            <Blossom s={d.s} c={d.c} />
          ) : (
            <Star s={d.s} c={d.c} />
          )}
        </span>
      ))}
    </div>
  )
}

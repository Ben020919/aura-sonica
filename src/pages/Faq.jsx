import { Link } from 'react-router-dom'

const NOTIFY_EMAIL = 'VENUSLEUNG412@GMAIL.COM'

const QA = [
  {
    q: '點樣落單?',
    a: '喺商店揀商品「加入購物車」→ 撳右上角購物車 → 去結帳,填收貨資料就得（需要先登入）。',
  },
  {
    q: '點付款?',
    a: '商品貨款用 FPS／轉數快。落單後 Venus 會聯絡你安排。',
  },
  {
    q: '點送貨?幾時到?',
    a: '一律順豐到付,運費收件時直接畀順豐。收到訂單後會盡快寄出,出貨會 email 通知你。',
  },
  {
    q: '可以退貨嗎?',
    a: '收貨 7 日內、商品全新連原包裝可申請退貨。詳情請睇退貨與退款政策。',
  },
  {
    q: '忘記密碼點算?',
    a: '暫時請直接聯絡我哋幫你處理。',
  },
]

export default function Faq() {
  return (
    <section className="page doc-page">
      <div className="section-inner policy" style={{ maxWidth: 720 }}>
        <h1 style={{ fontFamily: 'var(--serif)', color: 'var(--sea-700)' }}>常見問題 · 聯絡我們</h1>

        <div style={{ margin: '2rem 0' }}>
          {QA.map((item) => (
            <div key={item.q} style={{ marginBottom: '1.4rem' }}>
              <h3 style={{ margin: '0 0 0.3rem' }}>{item.q}</h3>
              <p style={{ color: 'var(--ink-soft)', margin: 0 }}>{item.a}</p>
            </div>
          ))}
        </div>

        <article>
          <h2>聯絡我們</h2>
          <p>電郵:<a href={`mailto:${NOTIFY_EMAIL}`}>{NOTIFY_EMAIL}</a></p>
          <p style={{ color: 'var(--ink-soft)' }}>電話:（稍後提供）</p>
          <p style={{ marginTop: '1.2rem' }}>
            亦可睇下 <Link to="/policy">條款與政策</Link>。
          </p>
        </article>
      </div>
    </section>
  )
}

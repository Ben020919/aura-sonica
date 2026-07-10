import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'
import { downloadReceiptPdf } from '../lib/receipt.js'
import Receipt from '../components/Receipt.jsx'

const STATUS = {
  new: { t: '新訂單', c: '#5b7fb0' },
  paid: { t: '已付款', c: '#3f9d7a' },
  shipped: { t: '已出貨', c: '#c08a2e' },
  done: { t: '完成', c: '#3f9d7a' },
  cancelled: { t: '已取消', c: '#a06b6b' },
}
const RETURN = {
  requested: '退貨審核中',
  approved: '退貨已批准',
  rejected: '退貨未受理',
  refunded: '已退款',
}

export default function MyOrders() {
  const { user, ready } = useAuth()
  const [orders, setOrders] = useState(null)
  const [err, setErr] = useState('')

  const receiptRef = useRef(null)
  const [pdfOrder, setPdfOrder] = useState(null)
  const [makingPdf, setMakingPdf] = useState(null)
  const [returnFor, setReturnFor] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user) return
    api('/api/orders')
      .then(setOrders)
      .catch((e) => setErr(e.message))
  }, [user])

  async function download(order) {
    setMakingPdf(order.id)
    setPdfOrder(order)
    await new Promise((r) => setTimeout(r, 90)) // 等 Receipt render 好
    try {
      await downloadReceiptPdf(receiptRef.current, `AURA-收據-${order.order_no}.pdf`)
    } finally {
      setMakingPdf(null)
      setPdfOrder(null)
    }
  }

  async function submitReturn(e) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      const updated = await api(`/api/orders/${returnFor.id}/return`, {
        method: 'POST',
        body: { reason },
      })
      setOrders((os) => os.map((o) => (o.id === updated.id ? updated : o)))
      setReturnFor(null)
      setReason('')
    } catch (e2) {
      alert(e2.message)
    } finally {
      setBusy(false)
    }
  }

  async function cancel(order) {
    if (!window.confirm(`確定取消訂單 ${order.order_no}？`)) return
    try {
      const updated = await api(`/api/orders/${order.id}/cancel`, { method: 'POST' })
      setOrders((os) => os.map((o) => (o.id === updated.id ? updated : o)))
    } catch (e2) {
      alert(e2.message)
    }
  }

  if (!ready) return <div className="page"><div className="section-inner">載入中…</div></div>

  if (!user) {
    return (
      <section className="page">
        <div className="section-inner" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <h2 style={{ fontFamily: 'var(--serif)', color: 'var(--sea-700)' }}>我的訂單</h2>
          <p style={{ color: 'var(--ink-soft)', marginTop: '1rem' }}>
            請先喺右上角登入,先睇到你嘅訂單。
          </p>
          <Link to="/shop" className="btn" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>
            去商店
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="page doc-page">
      <div className="section-inner" style={{ maxWidth: 820 }}>
        <h2 style={{ fontFamily: 'var(--serif)', color: 'var(--sea-700)', marginBottom: '0.4rem' }}>
          我的訂單
        </h2>
        <p style={{ color: 'var(--ink-soft)', marginBottom: '1.8rem', fontSize: '0.9rem' }}>
          睇返你嘅訂單同狀態,亦可以喺呢度下載收據、申請退貨。
        </p>

        {err && <p style={{ color: '#a06b6b' }}>{err}</p>}
        {!orders && !err && <p style={{ color: 'var(--ink-soft)' }}>載入中… 🐚</p>}
        {orders && orders.length === 0 && (
          <p style={{ color: 'var(--ink-soft)' }}>
            仲未有訂單。<Link to="/shop">去商店睇下 →</Link>
          </p>
        )}

        <div style={{ display: 'grid', gap: '1.2rem' }}>
          {orders?.map((o) => {
            const st = STATUS[o.status] || { t: o.status, c: '#888' }
            const canReturn = (o.status === 'shipped' || o.status === 'done') && !o.return_status
            const canCancel = o.status === 'new'
            return (
              <div
                key={o.id}
                style={{
                  background: 'rgba(255,255,255,0.6)',
                  border: '1px solid var(--line, #e2e9f3)',
                  borderRadius: 16,
                  padding: '1.1rem 1.3rem',
                  backdropFilter: 'blur(6px)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <strong style={{ color: 'var(--sea-700)' }}>{o.order_no}</strong>
                    <span style={{ color: 'var(--ink-soft)', fontSize: '0.82rem', marginLeft: 10 }}>
                      {new Date(o.created_at).toLocaleString('zh-HK')}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      color: '#fff',
                      background: st.c,
                      borderRadius: 999,
                      padding: '2px 12px',
                    }}
                  >
                    {st.t}
                  </span>
                </div>

                <div style={{ margin: '0.7rem 0', fontSize: '0.9rem', color: 'var(--ink)' }}>
                  {o.items.map((it, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{it.product_name} × {it.quantity}</span>
                      <span>HKD {it.line_total}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--line, #eef3f9)', paddingTop: 8, fontWeight: 600, color: 'var(--sea-700)' }}>
                  <span>合計（送貨順豐到付）</span>
                  <span>HKD {o.total}</span>
                </div>

                {o.return_status && (
                  <div style={{ marginTop: 8, fontSize: '0.85rem', color: '#c08a2e' }}>
                    ↩︎ 退貨 {o.return_no}：{RETURN[o.return_status] || o.return_status}
                    {o.return_note && <div style={{ color: 'var(--ink-soft)' }}>備註：{o.return_note}</div>}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <button className="pill-action" disabled={makingPdf === o.id} onClick={() => download(o)}>
                    {makingPdf === o.id ? '製作中…' : '下載收據'}
                  </button>
                  {canReturn && (
                    <button className="pill-action" onClick={() => setReturnFor(o)}>
                      申請退貨
                    </button>
                  )}
                  {canCancel && (
                    <button className="pill-action danger" onClick={() => cancel(o)}>
                      取消訂單
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <p style={{ marginTop: '2rem', fontSize: '0.82rem', color: 'var(--ink-soft)' }}>
          退貨前請睇下{' '}
          <Link
            to="/policy"
            style={{ color: 'var(--sea-600, #3f6fa8)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}
          >
            退貨與退款政策 →
          </Link>
        </p>
      </div>

      {/* 退貨申請 modal */}
      {returnFor && (
        <div className="overlay" onClick={() => setReturnFor(null)}>
          <form className="modal glass" onClick={(e) => e.stopPropagation()} onSubmit={submitReturn}>
            <h3>申請退貨 · {returnFor.order_no}</h3>
            <p className="sub">請填寫退貨原因,我哋會喺 1–2 個工作天內審核。</p>
            <div className="field">
              <label>退貨原因</label>
              <textarea
                required
                rows="4"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="例如:收到時有損壞 / 寄錯款式…"
              />
            </div>
            <button className="btn" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
              {busy ? '提交中…' : '提交申請'}
            </button>
            <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '0.6rem', lineHeight: 1.6 }}>
              只接受壞咗 / 寄錯、收貨 7 日內、商品全新連原包裝。詳見{' '}
              <Link to="/policy" style={{ color: 'var(--sea-600, #3f6fa8)', fontWeight: 600, textDecoration: 'underline' }}>退貨政策</Link>。
            </p>
          </form>
        </div>
      )}

      {/* 收據（畫 PDF 用,收埋畫面外） */}
      <Receipt order={pdfOrder} innerRef={receiptRef} />
    </section>
  )
}

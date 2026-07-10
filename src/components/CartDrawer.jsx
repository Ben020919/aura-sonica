import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Trash2, ShoppingBag, Minus, Plus, ChevronLeft, Download } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'
import { downloadReceiptPdf } from '../lib/receipt.js'
import { useCatalog } from '../context/CatalogContext.jsx'

const inputStyle = {
  width: '100%',
  padding: '0.7rem 0.9rem',
  borderRadius: 12,
  border: '1px solid var(--line, #d9e2f0)',
  background: 'rgba(255,255,255,0.6)',
  fontFamily: 'inherit',
  fontSize: '0.95rem',
  color: 'var(--ink, #33415c)',
}

export default function CartDrawer({ onClose, onRequestLogin }) {
  const { items, setQty, remove, clear } = useCart()
  const { user } = useAuth()
  const { products } = useCatalog()
  const cartItems = useMemo(
    () =>
      Object.keys(items)
        .map((slug) => products.find((p) => p.id === slug))
        .filter(Boolean),
    [items, products],
  )

  const [view, setView] = useState('bag') // 'bag' | 'form' | 'done'
  const [form, setForm] = useState({
    contact_name: '',
    contact_phone: '',
    shipping_address: '',
    note: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [placed, setPlaced] = useState(null)
  const [makingPdf, setMakingPdf] = useState(false)
  const receiptRef = useRef(null)

  const total = cartItems.reduce((s, p) => s + p.price * (items[p.id] || 0), 0)

  function goCheckout() {
    if (!user) {
      onRequestLogin?.()
      return
    }
    setForm((f) => ({ ...f, contact_name: f.contact_name || user.name || '' }))
    setError('')
    setView('form')
  }

  async function submitOrder(e) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      const order = await api('/api/orders', {
        method: 'POST',
        body: {
          items: cartItems.map((p) => ({ product_slug: p.id, quantity: items[p.id] })),
          contact_name: form.contact_name,
          contact_phone: form.contact_phone,
          contact_email: user?.email,
          shipping_address: form.shipping_address,
          note: form.note || null,
        },
      })
      setPlaced(order)
      clear() // 落單成功清空購物車
      setView('done')
    } catch (err) {
      setError(err.status ? err.message : '連唔到伺服器，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div
      className="overlay"
      onClick={onClose}
      style={{ justifyContent: 'flex-end', padding: 0 }}
    >
      <motion.aside
        className="drawer"
        onClick={(e) => e.stopPropagation()}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* ── 購物車 ── */}
        {view === 'bag' && (
          <>
            <div className="drawer-head">
              <h3>
                <ShoppingBag size={18} style={{ marginRight: 8, verticalAlign: -3 }} />
                購物車
              </h3>
              <button className="icon-btn" onClick={onClose} aria-label="關閉">
                <X size={20} />
              </button>
            </div>

            <div className="drawer-body">
              {cartItems.length === 0 ? (
                <div className="drawer-empty">
                  購物車仲空空如也 🐚
                  <br />
                  喺商店撳「加入購物車」，佢哋就會游到呢度。
                </div>
              ) : (
                <>
                  {cartItems.map((p) => (
                    <div className="fav-row" key={p.id}>
                      <img src={p.img} alt={p.name} />
                      <div className="meta">
                        <div className="n">{p.name}</div>
                        <div className="p">HKD {p.price}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                          <button
                            className="qty-btn"
                            onClick={() => setQty(p.id, (items[p.id] || 1) - 1)}
                            aria-label="減少"
                          >
                            <Minus size={13} />
                          </button>
                          <span style={{ minWidth: 18, textAlign: 'center' }}>
                            {items[p.id]}
                          </span>
                          <button
                            className="qty-btn"
                            onClick={() => setQty(p.id, (items[p.id] || 1) + 1)}
                            aria-label="增加"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                      <button className="rm" onClick={() => remove(p.id)} aria-label="移除">
                        <Trash2 size={17} />
                      </button>
                    </div>
                  ))}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '1.4rem',
                      fontFamily: 'var(--serif)',
                      color: 'var(--sea-700)',
                    }}
                  >
                    <span>合計</span>
                    <span style={{ fontFamily: 'var(--cormorant)', fontSize: '1.4rem' }}>
                      HKD {total}
                    </span>
                  </div>

                  <button
                    className="btn"
                    style={{ width: '100%', justifyContent: 'center', marginTop: '1.2rem' }}
                    onClick={goCheckout}
                  >
                    {user ? '去結帳 →' : '登入後結帳'}
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {/* ── 收貨資料 ── */}
        {view === 'form' && (
          <>
            <div className="drawer-head">
              <h3>
                <button
                  className="icon-btn"
                  onClick={() => setView('bag')}
                  aria-label="返回"
                  style={{ marginRight: 6 }}
                >
                  <ChevronLeft size={20} />
                </button>
                填收貨資料
              </h3>
              <button className="icon-btn" onClick={onClose} aria-label="關閉">
                <X size={20} />
              </button>
            </div>

            <form className="drawer-body" onSubmit={submitOrder}>
              <div style={{ display: 'grid', gap: '0.9rem' }}>
                <label style={{ display: 'grid', gap: 5 }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>收貨人</span>
                  <input
                    style={inputStyle}
                    required
                    value={form.contact_name}
                    onChange={(e) => update('contact_name', e.target.value)}
                    placeholder="你嘅名"
                  />
                </label>
                <label style={{ display: 'grid', gap: 5 }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>聯絡電話</span>
                  <input
                    style={inputStyle}
                    required
                    value={form.contact_phone}
                    onChange={(e) => update('contact_phone', e.target.value)}
                    placeholder="例如 9123 4567"
                  />
                </label>
                <label style={{ display: 'grid', gap: 5 }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
                    順豐收貨地址 / 順豐站碼
                  </span>
                  <textarea
                    style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }}
                    required
                    value={form.shipping_address}
                    onChange={(e) => update('shipping_address', e.target.value)}
                    placeholder="順豐送去邊？（住址、順豐站碼或智能櫃）"
                  />
                </label>
                <label style={{ display: 'grid', gap: 5 }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>備註（可選）</span>
                  <textarea
                    style={{ ...inputStyle, minHeight: 48, resize: 'vertical' }}
                    value={form.note}
                    onChange={(e) => update('note', e.target.value)}
                    placeholder="想同 Venus 講嘅嘢…"
                  />
                </label>
              </div>

              {error && <div className="error" style={{ marginTop: '0.9rem' }}>{error}</div>}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '1.2rem',
                  fontFamily: 'var(--serif)',
                  color: 'var(--sea-700)',
                }}
              >
                <span>合計</span>
                <span style={{ fontFamily: 'var(--cormorant)', fontSize: '1.4rem' }}>
                  HKD {total}
                </span>
              </div>

              <button
                className="btn"
                type="submit"
                disabled={submitting}
                style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
              >
                {submitting ? '落單中…' : `確認落單 · HKD ${total}`}
              </button>
              <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', marginTop: '0.8rem', lineHeight: 1.6 }}>
                🚚 送貨：<strong>順豐到付</strong>。落單後 Venus 會聯絡你安排商品付款（FPS／轉數快）🌊
              </p>
            </form>
          </>
        )}

        {/* ── 落單成功 ── */}
        {view === 'done' && (
          <>
            <div className="drawer-head">
              <h3>訂單已收到</h3>
              <button className="icon-btn" onClick={onClose} aria-label="關閉">
                <X size={20} />
              </button>
            </div>
            <div className="drawer-body" style={{ textAlign: 'center', paddingTop: '2rem' }}>
              <div style={{ fontSize: '3.2rem' }}>🐚</div>
              <h4 style={{ fontFamily: 'var(--serif)', color: 'var(--sea-700)', margin: '0.8rem 0 0.4rem' }}>
                多謝你嘅訂單！
              </h4>
              <p style={{ color: 'var(--ink-soft)' }}>訂單編號 {placed?.order_no}</p>
              <p style={{ color: 'var(--ink-soft)', marginTop: '0.8rem', lineHeight: 1.7 }}>
                確認信已寄到你嘅 email；
                <br />
                Venus 會盡快聯絡你安排付款同寄送 🌊
              </p>
              <button
                className="btn"
                disabled={makingPdf}
                onClick={async () => {
                  setMakingPdf(true)
                  try {
                    await downloadReceiptPdf(receiptRef.current, `AURA-收據-${placed?.order_no}.pdf`)
                  } finally {
                    setMakingPdf(false)
                  }
                }}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  marginTop: '1.6rem',
                  background: 'transparent',
                  color: 'var(--sea-700)',
                  border: '1px solid rgba(127, 169, 214, 0.6)',
                }}
              >
                <Download size={16} style={{ marginRight: 6 }} />
                {makingPdf ? '製作中…' : '下載收據 PDF'}
              </button>
              <button
                className="btn"
                onClick={onClose}
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.7rem' }}
              >
                完成
              </button>

              {/* 收據內容：畫落 PDF 用，收埋喺畫面外 */}
              {placed && (
                <div
                  ref={receiptRef}
                  style={{
                    position: 'absolute',
                    left: -9999,
                    top: 0,
                    width: 480,
                    background: '#fff',
                    color: '#2c3a52',
                    padding: 32,
                    textAlign: 'left',
                    fontFamily: 'system-ui, "PingFang HK", sans-serif',
                  }}
                >
                  <div style={{ textAlign: 'center', borderBottom: '2px solid #5b7fb0', paddingBottom: 14, marginBottom: 16 }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#2f4d73', lineHeight: 1.2 }}>AURA_Sonica</div>
                    <div style={{ fontSize: 12, color: '#8595ac', letterSpacing: 3, marginTop: 9 }}>RECEIPT</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span>訂單編號</span>
                    <strong>{placed.order_no}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 12 }}>
                    <span>日期</span>
                    <span>{new Date(placed.created_at).toLocaleString('zh-HK')}</span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #d9e2f0' }}>
                        <th style={{ padding: '6px 0', textAlign: 'left' }}>商品</th>
                        <th style={{ textAlign: 'center' }}>數量</th>
                        <th style={{ textAlign: 'right' }}>金額</th>
                      </tr>
                    </thead>
                    <tbody>
                      {placed.items.map((it, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #eef3f9' }}>
                          <td style={{ padding: '6px 0' }}>{it.product_name}</td>
                          <td style={{ textAlign: 'center' }}>× {it.quantity}</td>
                          <td style={{ textAlign: 'right' }}>HKD {it.line_total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: '#2f4d73', borderTop: '1px solid #d9e2f0', marginTop: 6, paddingTop: 6 }}>
                    <span>商品合計</span>
                    <span>HKD {placed.total}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#5b6b85', marginTop: 4 }}>
                    <span>送貨</span>
                    <span>順豐到付</span>
                  </div>
                  <div style={{ marginTop: 16, fontSize: 12, color: '#5b6b85', lineHeight: 1.8 }}>
                    <div>收貨人：{placed.contact_name}　{placed.contact_phone}</div>
                    <div>收貨地址：{placed.shipping_address}</div>
                    <div style={{ marginTop: 6 }}>
                      商品付款：FPS／轉數快 · {placed.payment_status === 'paid' ? '已付款' : '待付款'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#8595ac', lineHeight: 1.9 }}>
                    🐚 多謝你嘅支持 🐚
                    <br />
                    AURA_Sonica
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </motion.aside>
    </div>
  )
}

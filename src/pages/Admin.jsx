import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { api, apiUpload } from '../lib/api.js'
import '../styles/admin.css'

const ORDER_STATUS = [
  { v: 'new', label: '新單' },
  { v: 'paid', label: '已付款' },
  { v: 'shipped', label: '已寄出' },
  { v: 'done', label: '完成' },
  { v: 'cancelled', label: '取消' },
]
const PAY_STATUS = [
  { v: 'unpaid', label: '未付' },
  { v: 'paid', label: '已付' },
  { v: 'refunded', label: '已退' },
]
const RETURN_STATUS = [
  { v: 'requested', label: '審核中' },
  { v: 'approved', label: '批准' },
  { v: 'rejected', label: '拒絕' },
  { v: 'refunded', label: '已退款' },
]

export default function Admin() {
  const { user, login, logout, ready } = useAuth()
  const [tab, setTab] = useState('orders')

  if (!ready) {
    return (
      <div className="admin-center">
        <p className="muted">載入中…</p>
      </div>
    )
  }

  if (!user) return <AdminLogin login={login} />

  if (!user.is_admin) {
    return (
      <div className="admin-center">
        <div className="admin-card">
          <h2>唔係管理員帳戶</h2>
          <p className="muted">「{user.name}」冇後台權限。</p>
          <button className="admin-btn ghost" onClick={logout}>
            登出換帳戶
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-wrap">
      <div className="admin-top">
        <h1>AURA_Sonica 後台</h1>
        <div>
          <span>{user.name}（管理員）</span>
          <button className="admin-btn ghost sm" onClick={logout}>
            登出
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={tab === 'orders' ? 'active' : ''}
          onClick={() => setTab('orders')}
        >
          訂單
        </button>
        <button
          className={tab === 'products' ? 'active' : ''}
          onClick={() => setTab('products')}
        >
          商品
        </button>
        <button
          className={tab === 'notes' ? 'active' : ''}
          onClick={() => setTab('notes')}
        >
          留言
        </button>
      </div>

      {tab === 'orders' ? (
        <OrdersPanel />
      ) : tab === 'products' ? (
        <ProductsPanel />
      ) : (
        <NotesPanel />
      )}
    </div>
  )
}

function AdminLogin({ login }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    const r = await login(form)
    setBusy(false)
    if (!r.ok) setErr(r.error)
  }

  return (
    <div className="admin-center">
      <form className="admin-card" onSubmit={submit}>
        <h2>後台登入</h2>
        <p className="muted">請用管理員帳戶登入</p>
        <input
          type="email"
          required
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        <input
          type="password"
          required
          placeholder="密碼"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        />
        {err && <div className="admin-err">{err}</div>}
        <button type="submit" className="admin-btn" disabled={busy}>
          {busy ? '登入中…' : '登入'}
        </button>
      </form>
    </div>
  )
}

const ORDER_FILTERS = [
  { v: 'all', label: '全部' },
  { v: 'new', label: '新單' },
  { v: 'paid', label: '已付款' },
  { v: 'shipped', label: '已寄出' },
  { v: 'done', label: '完成' },
  { v: 'returns', label: '退貨中' },
  { v: 'cancelled', label: '取消' },
]

// 只用關鍵欄位做「有冇變」嘅指紋，自動刷新時冇變就唔重繪（唔會打斷緊揀嘅下拉）
function orderSig(arr) {
  return arr
    .map((o) => `${o.id}:${o.status}:${o.payment_status}:${o.return_status || ''}:${o.return_note || ''}`)
    .join('|')
}

function OrdersPanel() {
  const [orders, setOrders] = useState(null)
  const [err, setErr] = useState('')
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')

  async function load() {
    try {
      const data = await api('/api/admin/orders')
      setOrders((prev) => (prev && orderSig(prev) === orderSig(data) ? prev : data))
      setErr('')
    } catch (e) {
      setErr(e.message)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 30000) // 每 30 秒自動更新
    return () => clearInterval(t)
  }, [])

  async function change(id, field, value) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const updated = await api('/api/admin/orders/' + id, {
          method: 'PATCH',
          body: { [field]: value },
        })
        setOrders((os) => os.map((o) => (o.id === id ? updated : o)))
        return
      } catch (e) {
        // 後端可能啱 redeploy → 網絡錯誤自動重試一次
        const transient = /failed to fetch|networkerror|load failed/i.test(e.message || '')
        if (transient && attempt === 0) {
          await new Promise((r) => setTimeout(r, 1500))
          continue
        }
        alert(
          transient
            ? '連線唔到伺服器（後端可能啱啱更新緊）。等一兩分鐘，撳「↻ 更新」再試。'
            : e.message,
        )
        return
      }
    }
  }

  function changeReturnNote(o) {
    const note = window.prompt(
      '退貨備註（批准 → 填退貨編號 / 寄件方式；拒絕 → 填原因）',
      o.return_note || '',
    )
    if (note === null) return
    change(o.id, 'return_note', note)
  }

  if (err) return <p className="admin-err">{err}</p>
  if (!orders) return <p className="muted">載入中…</p>

  const countFor = (v) =>
    v === 'all'
      ? orders.length
      : v === 'returns'
      ? orders.filter((o) => ['requested', 'approved'].includes(o.return_status)).length
      : orders.filter((o) => o.status === v).length

  const q = query.trim().toLowerCase()
  const shown = orders.filter((o) => {
    if (filter === 'returns') {
      if (!['requested', 'approved'].includes(o.return_status)) return false
    } else if (filter !== 'all' && o.status !== filter) {
      return false
    }
    if (q) {
      const hay = `${o.order_no || ''} ${o.contact_name || ''} ${o.contact_phone || ''} ${o.contact_email || ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })

  return (
    <>
      <div className="admin-filters">
        {ORDER_FILTERS.map((f) => (
          <button
            key={f.v}
            className={`filter-pill ${filter === f.v ? 'active' : ''}`}
            onClick={() => setFilter(f.v)}
          >
            {f.label} <span className="filter-count">{countFor(f.v)}</span>
          </button>
        ))}
        <input
          className="admin-input admin-search"
          placeholder="搜尋 編號 / 名 / 電話…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="admin-btn ghost sm" onClick={load} title="立即重新整理">
          ↻ 更新
        </button>
      </div>
      <p className="admin-updated muted">
        🟢 每 30 秒自動更新 · 有新訂單亦會即時 email 通知 Venus
      </p>

      {!shown.length ? (
        <p className="muted">{orders.length ? '冇符合嘅訂單。' : '仲未有訂單。'}</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>訂單編號</th>
                <th>客人 / 地址</th>
                <th>聯絡</th>
                <th>商品</th>
                <th>合計</th>
                <th>訂單狀態</th>
                <th>付款</th>
                <th>時間</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((o) => (
                <tr key={o.id} className={o.status === 'cancelled' ? 'row-cancelled' : ''}>
              <td>{o.order_no || `#${o.id}`}</td>
              <td>
                {o.contact_name}
                <br />
                <small>{o.shipping_address}</small>
              </td>
              <td>
                {o.contact_phone}
                <br />
                <small>{o.contact_email}</small>
              </td>
              <td>
                {o.items.map((it, i) => (
                  <div key={i}>
                    {it.product_name} × {it.quantity}
                  </div>
                ))}
                {o.note && (
                  <div>
                    <small>備註：{o.note}</small>
                  </div>
                )}
                {o.return_status && (
                  <div
                    style={{
                      marginTop: 6,
                      padding: '6px 8px',
                      background: '#fff6e9',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  >
                    <div>↩︎ 退貨 {o.return_no}</div>
                    <div style={{ color: '#8a7350' }}>原因：{o.return_reason}</div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 4, alignItems: 'center' }}>
                      <select
                        className="admin-input"
                        value={o.return_status}
                        onChange={(e) => change(o.id, 'return_status', e.target.value)}
                      >
                        {RETURN_STATUS.map((s) => (
                          <option key={s.v} value={s.v}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                      <button
                        className="admin-btn ghost sm"
                        onClick={() => changeReturnNote(o)}
                      >
                        備註
                      </button>
                    </div>
                    {o.return_note && (
                      <div style={{ color: '#8a7350', marginTop: 2 }}>
                        備註：{o.return_note}
                      </div>
                    )}
                  </div>
                )}
              </td>
              <td>HKD {o.total}</td>
              <td>
                <select
                  className="admin-input"
                  value={o.status}
                  disabled={o.status === 'cancelled'}
                  title={o.status === 'cancelled' ? '客人已取消，狀態已鎖定' : undefined}
                  onChange={(e) => change(o.id, 'status', e.target.value)}
                >
                  {ORDER_STATUS.map((s) => (
                    <option key={s.v} value={s.v}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <select
                  className="admin-input"
                  value={o.payment_status}
                  onChange={(e) => change(o.id, 'payment_status', e.target.value)}
                >
                  {PAY_STATUS.map((s) => (
                    <option key={s.v} value={s.v}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <small>{new Date(o.created_at).toLocaleString('zh-HK')}</small>
              </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function NotesPanel() {
  const [notes, setNotes] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    api('/api/admin/notes').then(setNotes).catch((e) => setErr(e.message))
  }, [])

  if (err) return <p className="admin-err">{err}</p>
  if (!notes) return <p className="muted">載入中…</p>
  if (!notes.length) return <p className="muted">仲未有留言。</p>

  return (
    <>
      <div className="admin-bar">
        <span className="muted">{notes.length} 則留言</span>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table" style={{ tableLayout: 'fixed', minWidth: 560 }}>
          <thead>
            <tr>
              <th style={{ width: 168 }}>時間</th>
              <th style={{ width: 110 }}>簡稱</th>
              <th>留言</th>
            </tr>
          </thead>
          <tbody>
            {notes.map((n) => (
              <tr key={n.id}>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <small>{new Date(n.created_at).toLocaleString('zh-HK')}</small>
                </td>
                <td>{n.nickname || '—'}</td>
                <td style={{ whiteSpace: 'pre-wrap' }}>{n.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function ProductsPanel() {
  const [products, setProducts] = useState(null)
  const [categories, setCategories] = useState([])
  const [err, setErr] = useState('')
  const [editing, setEditing] = useState(null) // product 物件 or 'new' or null

  function load() {
    api('/api/admin/products').then(setProducts).catch((e) => setErr(e.message))
  }
  useEffect(() => {
    load()
    api('/api/categories').then(setCategories).catch(() => {})
  }, [])

  async function toggleActive(p) {
    const u = await api('/api/admin/products/' + p.id, {
      method: 'PATCH',
      body: { is_active: !p.is_active },
    })
    setProducts((ps) => ps.map((x) => (x.id === p.id ? u : x)))
  }

  async function del(p) {
    if (!confirm(`確定刪除「${p.name}」？`)) return
    await api('/api/admin/products/' + p.id, { method: 'DELETE' })
    setProducts((ps) => ps.filter((x) => x.id !== p.id))
  }

  if (err) return <p className="admin-err">{err}</p>
  if (!products) return <p className="muted">載入中…</p>

  return (
    <>
      <div className="admin-bar">
        <span className="muted">{products.length} 件商品</span>
        <button className="admin-btn sm" onClick={() => setEditing('new')}>
          ＋ 新增商品
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>商品</th>
              <th>分類</th>
              <th>價錢</th>
              <th>庫存</th>
              <th>狀態</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="admin-prod">
                    {p.img && <img src={p.img} alt="" />}
                    <div>
                      {p.name}
                      <br />
                      <small>{p.slug}</small>
                    </div>
                  </div>
                </td>
                <td>{p.category}</td>
                <td>HKD {p.price}</td>
                <td>{p.stock}</td>
                <td>
                  <button
                    className="pill-btn"
                    onClick={() => toggleActive(p)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    title="撳一下切換上架 / 落架"
                  >
                    <span className={`pill ${p.is_active ? 'on' : 'off'}`}>
                      {p.is_active ? '上架' : '落架'}
                    </span>
                  </button>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button
                    className="admin-btn ghost sm"
                    onClick={() => setEditing(p)}
                  >
                    改
                  </button>{' '}
                  <button className="admin-btn danger sm" onClick={() => del(p)}>
                    刪
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProductEditor
          product={editing === 'new' ? null : editing}
          categories={categories}
          onCategoryCreated={(c) => setCategories((cs) => [...cs, c])}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            load()
          }}
        />
      )}
    </>
  )
}

function ProductEditor({ product, categories, onCategoryCreated, onClose, onSaved }) {
  const isNew = !product
  const [form, setForm] = useState({
    slug: product?.slug || '',
    name: product?.name || '',
    name_en: product?.name_en || '',
    category: product?.category || categories[0]?.slug || 'bag',
    price: product?.price ?? 0,
    stock: product?.stock ?? 0,
    img: product?.img || '',
    note: product?.note || '',
    is_active: product?.is_active ?? true,
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const up = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function onPickImage(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setErr('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await apiUpload('/api/admin/upload', fd)
      up('img', r.url)
    } catch (e2) {
      setErr(e2.message || '上載失敗')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = '' // 容許再揀同一個檔
    }
  }

  async function addCategory() {
    const name = window.prompt('新分類名稱（例如：貼紙）')
    if (!name || !name.trim()) return
    try {
      const cat = await api('/api/admin/categories', {
        method: 'POST',
        body: { name: name.trim() },
      })
      onCategoryCreated?.(cat)
      up('category', cat.slug)
    } catch (e2) {
      setErr(e2.message || '加分類失敗')
    }
  }

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      const payload = {
        name: form.name,
        name_en: form.name_en || null,
        category: form.category,
        price: Number(form.price),
        stock: Number(form.stock),
        img: form.img || null,
        note: form.note || null,
        is_active: form.is_active,
      }
      if (isNew) {
        await api('/api/admin/products', {
          method: 'POST',
          body: { ...payload, slug: form.slug },
        })
      } else {
        await api('/api/admin/products/' + product.id, {
          method: 'PATCH',
          body: payload,
        })
      }
      onSaved()
    } catch (e2) {
      setErr(e2.message)
      setBusy(false)
    }
  }

  return (
    <div className="admin-overlay" onClick={onClose}>
      <form
        className="admin-editor"
        onClick={(e) => e.stopPropagation()}
        onSubmit={save}
      >
        <h3>{isNew ? '新增商品' : '改商品'}</h3>

        {isNew && (
          <label>
            代號 slug（英文小楷，例如 bag-ocean）
            <input
              required
              value={form.slug}
              onChange={(e) => up('slug', e.target.value)}
            />
          </label>
        )}
        <label>
          名稱
          <input required value={form.name} onChange={(e) => up('name', e.target.value)} />
        </label>
        <label>
          英文名（可選）
          <input value={form.name_en} onChange={(e) => up('name_en', e.target.value)} />
        </label>
        <label>
          分類
          <div style={{ display: 'flex', gap: 6 }}>
            <select
              style={{ flex: 1, minWidth: 0 }}
              value={form.category}
              onChange={(e) => up('category', e.target.value)}
            >
              {(categories.length
                ? categories
                : [{ slug: 'bag', name: '絨面袋' }, { slug: 'grip', name: '手機支架' }]
              ).map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="admin-btn ghost sm"
              onClick={addCategory}
              title="新增分類"
              style={{ whiteSpace: 'nowrap' }}
            >
              ＋ 新分類
            </button>
          </div>
        </label>
        <div className="admin-row">
          <label>
            價錢 HKD
            <input
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => up('price', e.target.value)}
            />
          </label>
          <label>
            庫存
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => up('stock', e.target.value)}
            />
          </label>
        </div>
        <div className="admin-imgfield">
          <span>商品圖片</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
            {form.img ? (
              <img
                src={form.img}
                alt=""
                style={{
                  width: 64,
                  height: 64,
                  objectFit: 'cover',
                  borderRadius: 8,
                  border: '1px solid #d9e2f0',
                }}
              />
            ) : (
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 8,
                  border: '1px dashed #c3d1e6',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#9fb0c8',
                  fontSize: 11,
                }}
              >
                冇圖
              </div>
            )}
            <button
              type="button"
              className="admin-btn ghost sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? '上載中…' : form.img ? '換圖片' : '上載圖片'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onPickImage}
              style={{ display: 'none' }}
            />
          </div>
        </div>
        <label>
          介紹（可選）
          <textarea
            rows="3"
            value={form.note}
            onChange={(e) => up('note', e.target.value)}
          />
        </label>
        <label className="row-check">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => up('is_active', e.target.checked)}
          />
          上架（前台睇到）
        </label>

        {err && <div className="admin-err">{err}</div>}

        <div className="admin-row">
          <button type="button" className="admin-btn ghost" onClick={onClose}>
            取消
          </button>
          <button type="submit" className="admin-btn" disabled={busy}>
            {busy ? '儲存中…' : '儲存'}
          </button>
        </div>
      </form>
    </div>
  )
}

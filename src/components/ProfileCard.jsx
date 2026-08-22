import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

// 「我的訂單」頁頂：個人資料（地址簿）+ 更改密碼
const inputStyle = {
  width: '100%',
  padding: '0.65rem 0.85rem',
  borderRadius: 12,
  border: '1px solid var(--line, #d9e2f0)',
  background: 'rgba(255,255,255,0.7)',
  fontFamily: 'inherit',
  fontSize: '0.93rem',
  color: 'var(--ink, #33415c)',
}
const labelStyle = {
  display: 'block',
  fontSize: '0.78rem',
  color: 'var(--ink-soft)',
  marginBottom: 4,
  letterSpacing: '0.04em',
}
const cardStyle = {
  background: 'rgba(255,255,255,0.6)',
  border: '1px solid var(--line, #e2e9f3)',
  borderRadius: 16,
  padding: '1.1rem 1.3rem',
  backdropFilter: 'blur(6px)',
  marginBottom: '1.6rem',
}

export default function ProfileCard() {
  const { user, updateProfile, changePassword } = useAuth()
  const [form, setForm] = useState({ name: '', phone: '', address: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const [pwOpen, setPwOpen] = useState(false)
  const [pw, setPw] = useState({ current_password: '', new_password: '', confirm: '' })
  const [pwBusy, setPwBusy] = useState(false)
  const [pwMsg, setPwMsg] = useState('')

  useEffect(() => {
    setForm({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '' })
  }, [user])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setP = (k) => (e) => setPw((p) => ({ ...p, [k]: e.target.value }))

  async function save(e) {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    setMsg('')
    const r = await updateProfile(form)
    setMsg(r.ok ? '已儲存 ✓ 下次落單會自動填好' : r.error)
    setSaving(false)
  }

  async function savePassword(e) {
    e.preventDefault()
    if (pwBusy) return
    setPwMsg('')
    if (pw.new_password.length < 6) return setPwMsg('新密碼最少 6 個字')
    if (pw.new_password !== pw.confirm) return setPwMsg('兩次輸入嘅新密碼唔一樣')
    setPwBusy(true)
    const r = await changePassword({ current_password: pw.current_password, new_password: pw.new_password })
    setPwMsg(r.ok ? '密碼已更改 ✓' : r.error)
    if (r.ok) setPw({ current_password: '', new_password: '', confirm: '' })
    setPwBusy(false)
  }

  const hasProfile = user?.phone || user?.address

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <strong style={{ color: 'var(--sea-700)' }}>個人資料 · 地址簿</strong>
          <span style={{ color: 'var(--ink-soft)', fontSize: '0.82rem', marginLeft: 10 }}>{user?.email}</span>
        </div>
        {!hasProfile && (
          <span style={{ fontSize: '0.78rem', color: '#c08a2e' }}>填好一次，之後落單自動填 🐚</span>
        )}
      </div>

      <form onSubmit={save} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginTop: '0.9rem' }}>
        <label>
          <span style={labelStyle}>姓名（收貨人）</span>
          <input style={inputStyle} value={form.name} onChange={set('name')} placeholder="例如：Venus" />
        </label>
        <label>
          <span style={labelStyle}>電話</span>
          <input style={inputStyle} value={form.phone} onChange={set('phone')} placeholder="例如：5904 8782" inputMode="tel" />
        </label>
        <label style={{ gridColumn: '1 / -1' }}>
          <span style={labelStyle}>收貨地址 / 順豐站碼</span>
          <textarea
            style={{ ...inputStyle, resize: 'vertical' }}
            rows={2}
            value={form.address}
            onChange={set('address')}
            placeholder="住址、順豐站碼或智能櫃"
          />
        </label>
        <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button className="pill-action" type="submit" disabled={saving}>
            {saving ? '儲存中…' : '儲存個人資料'}
          </button>
          <button className="pill-action" type="button" onClick={() => setPwOpen((v) => !v)}>
            {pwOpen ? '收起' : '更改密碼'}
          </button>
          {msg && <span style={{ fontSize: '0.85rem', color: msg.includes('✓') ? '#3f9d7a' : '#a06b6b' }}>{msg}</span>}
        </div>
      </form>

      {pwOpen && (
        <form
          onSubmit={savePassword}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '0.8rem',
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--line, #eef3f9)',
          }}
        >
          <label>
            <span style={labelStyle}>現有密碼</span>
            <input style={inputStyle} type="password" value={pw.current_password} onChange={setP('current_password')} autoComplete="current-password" />
          </label>
          <label>
            <span style={labelStyle}>新密碼（最少 6 個字）</span>
            <input style={inputStyle} type="password" value={pw.new_password} onChange={setP('new_password')} autoComplete="new-password" />
          </label>
          <label>
            <span style={labelStyle}>再輸入新密碼</span>
            <input style={inputStyle} type="password" value={pw.confirm} onChange={setP('confirm')} autoComplete="new-password" />
          </label>
          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button className="pill-action" type="submit" disabled={pwBusy}>
              {pwBusy ? '更改中…' : '確認更改密碼'}
            </button>
            {pwMsg && <span style={{ fontSize: '0.85rem', color: pwMsg.includes('✓') ? '#3f9d7a' : '#a06b6b' }}>{pwMsg}</span>}
          </div>
        </form>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

// 輸入 email 驗證碼（註冊後 / 結帳前用）。驗證成功後 user.email_verified 變 true。
export default function VerifyEmailBox({ onVerified }) {
  const { user, verifyEmail, resendVerification } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    const res = await verifyEmail(code)
    setBusy(false)
    if (res.ok) onVerified?.()
    else setError(res.error)
  }

  async function resend() {
    if (busy) return
    setBusy(true)
    setError('')
    const res = await resendVerification()
    setBusy(false)
    if (res.ok) setInfo(res.message)
    else setError(res.error)
  }

  return (
    <form onSubmit={submit}>
      <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: '0.8rem' }}>
        我哋寄咗一個 6 位驗證碼去 <strong>{user?.email}</strong>，驗證之後就可以落單。
        搵唔到可以睇吓垃圾郵件。
      </p>
      <div className="field">
        <label>驗證碼</label>
        <input
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            setError('')
          }}
          placeholder="例如 123456"
        />
      </div>
      {info && (
        <div style={{ color: 'var(--sea-700)', fontSize: '0.85rem', marginBottom: 8 }}>{info}</div>
      )}
      {error && <div className="error">{error}</div>}
      <button className="btn" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
        {busy ? '請稍等…' : '驗證'}
      </button>
      <div style={{ textAlign: 'center', marginTop: '0.7rem' }}>
        <button
          type="button"
          onClick={resend}
          disabled={busy}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--sea-500, #5b7fb0)',
            fontSize: '0.82rem',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          收唔到？重寄驗證碼
        </button>
      </div>
    </form>
  )
}

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

// mode: login | register | forgot | reset
const TITLES = {
  login: ['歡迎回來', '回到屬於你的那片海'],
  register: ['加入忘聲海', '留一個名字，讓 Aura 認得你'],
  forgot: ['忘記密碼', '輸入你的 email，我哋會寄重設驗證碼畀你'],
  reset: ['重設密碼', '輸入收到的驗證碼同新密碼'],
}

export default function AuthModal({ onClose }) {
  const { login, register, forgotPassword, resetPassword } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '', code: '' })
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }))
    setError('')
  }
  const go = (m) => {
    setMode(m)
    setError('')
    setInfo('')
  }

  async function submit(e) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    let res
    if (mode === 'login') res = await login(form)
    else if (mode === 'register') res = await register(form)
    else if (mode === 'forgot') res = await forgotPassword(form.email)
    else res = await resetPassword(form)
    setSubmitting(false)
    if (res.ok) {
      if (mode === 'forgot') {
        setInfo(res.message || '驗證碼已寄出，請查收 email。')
        setMode('reset')
      } else {
        onClose() // login / register / reset 成功 = 已登入
      }
    } else {
      setError(res.error)
    }
  }

  const [title, sub] = TITLES[mode]
  const btnLabel = { login: '登入', register: '註冊', forgot: '寄重設碼', reset: '重設密碼' }[mode]

  return (
    <div className="overlay" onClick={onClose}>
      <motion.div
        className="modal glass"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <button className="close" onClick={onClose} aria-label="關閉">
          <X size={18} />
        </button>
        <h3>{title}</h3>
        <p className="sub">{sub}</p>

        <form onSubmit={submit}>
          {mode === 'register' && (
            <div className="field">
              <label>簡稱 / 名字</label>
              <input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="你想 Aura 點叫你？"
              />
            </div>
          )}

          <div className="field">
            <label>Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          {mode === 'reset' && (
            <div className="field">
              <label>驗證碼（email 收到嘅 6 位數字）</label>
              <input
                required
                value={form.code}
                onChange={(e) => update('code', e.target.value)}
                placeholder="例如 123456"
              />
            </div>
          )}

          {(mode === 'login' || mode === 'register' || mode === 'reset') && (
            <div className="field">
              <label>{mode === 'reset' ? '新密碼' : '密碼'}</label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="至少 6 個字"
              />
            </div>
          )}

          {mode === 'login' && (
            <div style={{ textAlign: 'right', marginTop: -2, marginBottom: 8 }}>
              <button
                type="button"
                onClick={() => go('forgot')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--sea-500, #5b7fb0)',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                忘記密碼？
              </button>
            </div>
          )}

          {info && (
            <div style={{ color: 'var(--sea-700)', fontSize: '0.85rem', marginBottom: 8, lineHeight: 1.6 }}>
              {info}
            </div>
          )}
          {error && <div className="error">{error}</div>}

          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? '請稍等…' : btnLabel}
          </button>
        </form>

        <div className="switch">
          {mode === 'login' && (
            <>
              仲未有帳戶？<button onClick={() => go('register')}>註冊</button>
            </>
          )}
          {mode === 'register' && (
            <>
              已經有帳戶？<button onClick={() => go('login')}>登入</button>
            </>
          )}
          {(mode === 'forgot' || mode === 'reset') && (
            <>
              返去<button onClick={() => go('login')}>登入</button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function AuthModal({ onClose }) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')

  const isLogin = mode === 'login'

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }))
    setError('')
  }

  function submit(e) {
    e.preventDefault()
    const res = isLogin ? login(form) : register(form)
    if (res.ok) onClose()
    else setError(res.error)
  }

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
        <h3>{isLogin ? '歡迎回來' : '加入忘聲海'}</h3>
        <p className="sub">
          {isLogin ? '回到屬於你的那片海' : '留一個名字，讓 Aura 認得你'}
        </p>

        <form onSubmit={submit}>
          {!isLogin && (
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
          <div className="field">
            <label>密碼</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <div className="error">{error}</div>}

          <button className="btn" type="submit">
            {isLogin ? '登入' : '註冊'}
          </button>
        </form>

        <div className="switch">
          {isLogin ? '仲未有帳戶？' : '已經有帳戶？'}
          <button
            onClick={() => {
              setMode(isLogin ? 'register' : 'login')
              setError('')
            }}
          >
            {isLogin ? '註冊' : '登入'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

import { useState } from 'react'
import { Send } from 'lucide-react'
import Reveal from '../components/Reveal.jsx'
import { sendNote, buildMailto, RECIPIENT } from '../lib/email.js'

export default function Note() {
  const [nickname, setNickname] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error

  async function handleSend(e) {
    e.preventDefault()
    if (!message.trim()) return
    setStatus('sending')
    try {
      const res = await sendNote({ nickname, message })
      if (res.method === 'fallback') {
        // EmailJS 未設定 → 開訪客郵件 app 寄去 Venus
        window.location.href = buildMailto({ nickname, message })
      }
      setStatus('sent')
      setNickname('')
      setMessage('')
      setTimeout(() => setStatus('idle'), 6000)
    } catch (err) {
      console.error(err)
      // 失敗都用 mailto 後備
      window.location.href = buildMailto({ nickname, message })
      setStatus('sent')
    }
  }

  return (
    <section className="section note" id="note">
      <div className="section-inner">
        <Reveal>
          <h2>
            寫一個你曾經沒說出口的話,
            <br />
            Aura 會替你收進海裡。
          </h2>
        </Reveal>

        <Reveal delay={0.2}>
          <form className="note-card glass" onSubmit={handleSend}>
            <div className="field">
              <label>你的簡稱</label>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="留一個簡稱就好（例如：小海）"
                maxLength={24}
              />
            </div>
            <div className="field">
              <label>想說的話</label>
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="把心底那句話,輕輕放進貝殼裡…"
                required
              />
            </div>

            <button
              className="btn"
              type="submit"
              disabled={status === 'sending'}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Send size={16} />
              {status === 'sending' ? '正在送往海裡…' : 'Send a Note'}
            </button>

            {status === 'sent' && (
              <div className="sent-toast">
                🌊 你的聲音已經收進 Aura 的貝殼裡,謝謝你告訴我。
              </div>
            )}
          </form>
        </Reveal>

        <Reveal delay={0.4}>
          <div className="email-line">
            Email
            <strong>{RECIPIENT}</strong>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

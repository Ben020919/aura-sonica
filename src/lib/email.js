import emailjs from '@emailjs/browser'

// ── Page 6 留言寄去邊 ──────────────────────────────
export const RECIPIENT = 'VENUSLEUNG412@GMAIL.COM'

// EmailJS 設定（真正自動寄信）。
// Venus 去 https://www.emailjs.com 免費開戶，攞到呢 3 條 key 填返落嚟，
// 網站就會自動把留言寄到上面個 RECIPIENT，唔使開訪客自己嘅郵件 app。
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || ''
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || ''
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || ''

export const emailjsReady = Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY)

// 送出留言。若 EmailJS 未設定，回傳 needsFallback: true，
// 由介面用 mailto 後備方式打開訪客郵件 app。
export async function sendNote({ nickname, message }) {
  const alias = (nickname || '一位路過的旅人').trim()
  const body = (message || '').trim()

  if (emailjsReady) {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        from_name: alias,
        nickname: alias,
        message: body,
        to_email: RECIPIENT,
        reply_to: RECIPIENT,
      },
      { publicKey: PUBLIC_KEY },
    )
    return { ok: true, method: 'emailjs' }
  }

  return { ok: true, method: 'fallback' }
}

// mailto 後備：整理好主旨同內文，打開訪客郵件 app 寄去 Venus。
export function buildMailto({ nickname, message }) {
  const alias = (nickname || '一位路過的旅人').trim()
  const subject = `🐚 忘聲海留言 — 來自 ${alias}`
  const lines = [
    `簡稱：${alias}`,
    '',
    message || '',
    '',
    '— 由 AURA_Sonica 忘聲海送出',
  ]
  return `mailto:${RECIPIENT}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(lines.join('\n'))}`
}

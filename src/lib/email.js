import { api } from './api.js'

// 首頁「留言」寄去邊
export const RECIPIENT = 'VENUSLEUNG412@GMAIL.COM'

// 送出留言：打後端 /api/note，由後端用 SMTP 寄去 Venus。
// 失敗（例如後端未開）就丟 error，交由介面用 mailto 後備。
export async function sendNote({ nickname, message }) {
  await api('/api/note', {
    method: 'POST',
    auth: false,
    body: { nickname: nickname || null, message },
  })
  return { ok: true, method: 'backend' }
}

// mailto 後備：整理好主旨同內文，打開訪客郵件 app 寄去 Venus。
export function buildMailto({ nickname, message }) {
  const alias = (nickname || '一位路過的旅人').trim()
  const subject = `🐚 AURA_Sonica 留言 — 來自 ${alias}`
  const lines = [
    `簡稱：${alias}`,
    '',
    message || '',
    '',
    '— 由 AURA_Sonica 送出',
  ]
  return `mailto:${RECIPIENT}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(lines.join('\n'))}`
}

// Venus 嘅 WhatsApp（要同後端 app/notifications.py 一致）
export const WHATSAPP_NUMBER = '85259048782' // 國際格式：冇 +、冇空格
export const WHATSAPP_DISPLAY = '+852 5904 8782'

// 落單後用：自動填好「買咗咩、幾多錢」嘅 WhatsApp 連結，客人一撳就同 Venus 對話
export function whatsappPayLink(order) {
  const lines = [
    '你好 Venus！我喺 AURA_Sonica 落咗單，想安排付款 🐚',
    `訂單編號：${order.order_no}`,
    '商品：',
    ...(order.items || []).map((it) => `・${it.product_name} × ${it.quantity} — HKD ${it.line_total}`),
    `合計：HKD ${order.total}`,
    `收貨人：${order.contact_name}`,
  ]
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`
}

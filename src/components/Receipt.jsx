// 電子收據（落單頁同「我的訂單」共用）。畫落 PDF 用，平時收埋喺畫面外。
export default function Receipt({ order, innerRef }) {
  if (!order) return null
  return (
    <div
      ref={innerRef}
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
      <div
        style={{
          textAlign: 'center',
          borderBottom: '2px solid #5b7fb0',
          paddingBottom: 14,
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700, color: '#2f4d73', lineHeight: 1.2 }}>
          AURA_Sonica
        </div>
        <div style={{ fontSize: 12, color: '#8595ac', letterSpacing: 3, marginTop: 9 }}>
          RECEIPT
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
        <span>訂單編號</span>
        <strong>{order.order_no}</strong>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 12 }}>
        <span>日期</span>
        <span>{new Date(order.created_at).toLocaleString('zh-HK')}</span>
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
          {order.items.map((it, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #eef3f9' }}>
              <td style={{ padding: '6px 0' }}>{it.product_name}</td>
              <td style={{ textAlign: 'center' }}>× {it.quantity}</td>
              <td style={{ textAlign: 'right' }}>HKD {it.line_total}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 16,
          fontWeight: 700,
          color: '#2f4d73',
          borderTop: '1px solid #d9e2f0',
          marginTop: 6,
          paddingTop: 6,
        }}
      >
        <span>商品合計</span>
        <span>HKD {order.total}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#5b6b85', marginTop: 4 }}>
        <span>送貨</span>
        <span>順豐到付</span>
      </div>
      <div style={{ marginTop: 16, fontSize: 12, color: '#5b6b85', lineHeight: 1.8 }}>
        <div>收貨人：{order.contact_name}　{order.contact_phone}</div>
        <div>收貨地址：{order.shipping_address}</div>
        <div style={{ marginTop: 6 }}>
          商品付款：FPS／轉數快 · {order.payment_status === 'paid' ? '已付款' : order.payment_status === 'refunded' ? '已退款' : '待付款'}
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#8595ac', lineHeight: 1.9 }}>
        🐚 多謝你嘅支持 🐚
        <br />
        AURA_Sonica
      </div>
    </div>
  )
}

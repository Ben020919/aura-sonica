const NOTIFY_EMAIL = 'VENUSLEUNG412@GMAIL.COM'

export default function Policy() {
  return (
    <section className="page doc-page">
      <div className="section-inner policy" style={{ maxWidth: 760 }}>
        <h1 style={{ fontFamily: 'var(--serif)', color: 'var(--sea-700)' }}>條款與政策</h1>
        <nav style={{ display: 'flex', gap: 14, flexWrap: 'wrap', margin: '1rem 0 2.4rem', fontSize: '0.9rem' }}>
          <a href="#return">退貨與退款</a>
          <a href="#shipping">送貨</a>
          <a href="#privacy">私隱政策</a>
        </nav>

        {/* ── 退貨與退款 ── */}
        <article id="return" style={{ marginBottom: '2.6rem' }}>
          <h2>退貨與退款政策</h2>
          <p>親愛的顧客,感謝您選擇 Aura_Sonica。我們用心製作每一件療癒小物,也希望您能感受到這份心意。</p>

          <h3>一、以下商品恕不接受退貨</h3>
          <p style={{ color: 'var(--ink-soft)' }}>（訂製／客製化商品、已使用或已拆封之衛生相關商品;如有其他,會於商品頁另行註明。）</p>

          <h3>二、退貨申請期限</h3>
          <p>請於收到商品日起 <strong>7 天內</strong>（含例假日）提出申請,逾期恕不受理。</p>

          <h3>三、退貨條件</h3>
          <p>退貨商品須未經使用,且保持全新狀態,包含所有配件、贈品及原包裝,不得有使用痕跡或污損。若商品有明顯使用痕跡或包裝破損,品牌有權拒絕退貨或酌收整新費。</p>

          <h3>四、退貨申請步驟</h3>
          <ol>
            <li>登入官網 →「<strong>我的訂單</strong>」→ 點選「申請退貨」。</li>
            <li>填寫退貨原因並提交。</li>
            <li>待客服審核通過（1–2 個工作天）,您將收到退貨編號及寄件方式。</li>
            <li>將商品連同發票（如有）妥善包裝,依指定方式寄回。</li>
            <li>我們收到並檢查商品無誤後,將於 <strong>7 個工作天內</strong> 將款項退至您的原支付帳戶。</li>
          </ol>

          <h3>五、運費說明</h3>
          <ul>
            <li>因商品瑕疵或寄錯:退貨運費由我們全額負擔。</li>
            <li>因個人因素（不喜歡、改變心意）:退貨運費需由您自行負擔。</li>
          </ul>
        </article>

        {/* ── 送貨 ── */}
        <article id="shipping" style={{ marginBottom: '2.6rem' }}>
          <h2>送貨方式</h2>
          <p>本店一律採用 <strong>順豐到付</strong>。運費於收件時直接支付予順豐,店家不另收運費。</p>
          <p>收到訂單後,我們會盡快安排寄出;出貨後系統會以 email 通知你。</p>
          <p style={{ color: 'var(--ink-soft)' }}>付款方式:商品貨款以 FPS／轉數快安排,落單後我們會聯絡你。</p>
        </article>

        {/* ── 私隱 ── */}
        <article id="privacy">
          <h2>私隱政策</h2>
          <p>我們重視你的個人資料,並依《個人資料（私隱）條例》妥善處理。</p>
          <h3>收集的資料</h3>
          <p>姓名、聯絡電話、收貨地址、電郵地址（用於帳戶及處理訂單）。</p>
          <h3>用途</h3>
          <p>只用於處理訂單、送貨、退貨、及與你聯絡。我們<strong>不會出售</strong>你的個人資料,只在送貨（如順豐）等必要情況下分享所需資料。</p>
          <h3>你的權利</h3>
          <p>你可要求查閱、更正或刪除你的個人資料,請電郵 <a href={`mailto:${NOTIFY_EMAIL}`}>{NOTIFY_EMAIL}</a>。</p>
          <h3>Cookie</h3>
          <p>網站以瀏覽器儲存記住你的登入狀態與購物車,不作追蹤用途。</p>
        </article>
      </div>
    </section>
  )
}

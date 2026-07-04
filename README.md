# AURA_Sonica · 忘聲海 🐚

原創 IP「Aura」品牌網站 —— 空靈海洋療癒風（Ethereal Ocean）。
靜態相片配上流動海面、漂浮星星氣泡、視差滾動與淡入動畫，令整個網站「活」起來。

技術：**React + Vite + Framer Motion**

---

## 🚀 點樣啟動（第一次）

```bash
cd aura-sonica
npm install      # 只需第一次
npm run dev      # 開發模式，瀏覽器開 http://localhost:5178
```

打包成可上載的靜態網站：

```bash
npm run build    # 產出喺 dist/ 資料夾，可以放去任何 hosting
```

---

## 🗂️ 頁面流程（單頁向下捲）

| 段落 | 對應原稿 | 內容 |
|------|----------|------|
| 封面 | Page 1 | AURA_Sonica 大標題 + ENTER |
| 忘聲海 | Page 5 | 歡迎語 |
| 留言 | Page 6 | 訪客寫低心事 → 寄去 Venus |
| 關於 | Page 2 | 品牌介紹 |
| Aura | Page 3 | 角色介紹（會浮動的娃娃）|
| 故事 | Page 4 | 《第一顆珍珠》|
| 商店 | shop 1 / 2 / 2-1 | 絨面袋、手機支架（可摺疊）|

頂部導覽有：🔍 搜尋、❤️ 收藏、登入 / 註冊。

---

## ✉️ Page 6 留言：點寄到 Venus 個 email？

留言目前寄去 **VENUSLEUNG412@GMAIL.COM**（改嘅話去 `src/lib/email.js` 最上面）。

有兩個模式：

1. **未設定時（預設）** — 撳「Send a Note」會開訪客自己嘅郵件程式，內容已填好，寄去 Venus。即刻可用，零設定。
2. **設定 EmailJS 後（推薦）** — 網站自動寄信，唔使開訪客郵件程式：
   1. 去 <https://www.emailjs.com> 免費開戶
   2. 加一個 Email Service（連你 Gmail）同一個 Template
   3. 把 `.env.example` 複製成 `.env`，填返 3 條 key：
      ```
      VITE_EMAILJS_SERVICE_ID=xxx
      VITE_EMAILJS_TEMPLATE_ID=xxx
      VITE_EMAILJS_PUBLIC_KEY=xxx
      ```
   4. 重新 `npm run dev`（或重新 build）即可自動寄信。

> Template 入面可以用呢啲變數：`{{nickname}}`、`{{message}}`、`{{to_email}}`。

---

## ✏️ 想改內容？（唔使識寫 code）

| 想改乜 | 去邊個檔 |
|--------|----------|
| 商品名 / 價錢 / 相片 / 分類 | `src/data/products.js` |
| 《第一顆珍珠》故事文字 | `src/sections/Story.jsx` 最上面的 `STORY` |
| 品牌介紹文字 | `src/sections/About.jsx` |
| 收件 email | `src/lib/email.js` 的 `RECIPIENT` |
| 顏色主題 | `src/index.css` 最上面的 `:root` 色票 |

商品相片放喺 `public/products/`（`1.jpeg` ~ `17.jpeg`），換相直接覆蓋或改 `products.js` 的 `img` 路徑。

---

## 🔐 登入 / 收藏 說明

- 目前係**示範版**：帳戶同收藏存喺瀏覽器（localStorage），即開即用、唔使伺服器。
- 日後想要**真帳戶**（多裝置同步、真正會員）：只需把 `src/context/AuthContext.jsx`
  同 `FavoritesContext.jsx` 入面嘅函式，改成打後端 API（例如 Supabase / Firebase）即可，
  介面完全唔使改。
- **付款**功能按你要求暫時未做（收藏抽屜有「結帳」掣，稍後接金流即可）。

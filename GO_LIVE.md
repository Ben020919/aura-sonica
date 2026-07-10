# AURA_Sonica 上線清單（Render 全站部署）

網站而家係**全端**（前端 + 後端 + 資料庫）。上線要部署 3 樣嘢。
⚠️ **順序好重要**：先搞後端 + DB → 設前端 `VITE_API_URL` → 最後先 deploy 前端，否則 live 會暫時壞。

所有 code 已喺 GitHub 分支 **`tier3-full-shop`**。Review 冇問題就 merge 去 `main`。

---

## 1. 開資料庫（Render Postgres）
Render → **New → PostgreSQL** → Free plan → Create。建好即可（一陣後端會自動連）。

## 2. 開後端（Render Web Service）
Render → **New → Web Service** → 揀 `aura-sonica` repo：
- **Branch**：`tier3-full-shop`（之後改用 `main`）
- **Root Directory**：`backend`
- **Build Command**：`pip install -r requirements.txt`
- **Start Command**：`uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **連上 Step 1 個 Postgres** → Render 會自動注入 `DATABASE_URL`
- **Environment** 加：
  ```
  JWT_SECRET=（之前生成嗰串長隨機字）
  CORS_ORIGINS=https://aura-sonica.onrender.com
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=venusleung412@gmail.com
  SMTP_PASSWORD=（Venus 個 App Password）
  SMTP_FROM=venusleung412@gmail.com
  NOTIFY_EMAIL=venusleung412@gmail.com
  PUBLIC_BASE_URL=（呢個後端建好後嘅網址，見下）
  ```
- Deploy → 記低後端網址，例如 `https://aura-sonica-api.onrender.com`
- 補返 **`PUBLIC_BASE_URL`** = 嗰個網址 → 再 redeploy 一次。

## 3. 開管理員帳戶
後端 service → **Shell** → 跑：
```
python make_admin.py venusleung412@gmail.com 你想要嘅密碼
```

## 4. 前端指去後端
現有前端靜態站（aura-sonica.onrender.com）→ **Environment** 加：
```
VITE_API_URL=https://aura-sonica-api.onrender.com
```

## 5. 正式上線
將 `tier3-full-shop` **merge 去 `main`**（或叫前端站改為部署呢個分支）。
前端會重新 build（今次帶埋 `VITE_API_URL`）→ 打到後端 → 全站 work。

---

## 上線後檢查
開 https://aura-sonica.onrender.com：
- [ ] 商店載入到商品（DB）
- [ ] 註冊 / 登入到
- [ ] 落單 → 收到確認 email
- [ ] `/admin` 入到、改狀態客人收到 email
- [ ] 留言寄到 Venus

## 貼士（Render 免費 plan）
- 免費後端 service **閒置會休眠**，第一次打開要等 ~50 秒 cold start，正常。
- 免費 Postgres 有期限（Render 政策），長遠用要留意。

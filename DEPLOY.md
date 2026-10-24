# AURA_Sonica 部署指南

架構：**前端（Vite 靜態站）** + **後端（FastAPI）** + **Postgres**，全部放 Render。

---

## 一、本機全端跑（開發 / 測試）

開兩個 terminal。

**後端：**

```bash
cd backend
python3 -m venv venv && source venv/bin/activate   # 第一次先要
pip install -r requirements.txt                     # 第一次先要
cp .env.example .env                                # 第一次先要（預設 SQLite，唔使裝 Postgres）
python seed.py                                       # 匯入商品（第一次 / 想重設商品）
uvicorn app.main:app --reload --port 8000
```

**前端：**

```bash
npm install        # 第一次先要
npm run dev        # → http://localhost:5178
```

前端預設就打 `http://localhost:8000` 後端，唔使額外設定。

- 前台：http://localhost:5178
- **後台**：http://localhost:5178/#/admin

**點入後台？** 用管理員帳戶登入。為咗安全，公開註冊**永遠唔會**變管理員；管理員帳戶只可以由開發者喺 `backend/` 入面執行：

```bash
./venv/bin/python make_admin.py <email> <強密碼>
```

---

## 二、Render 部署

### 1. Postgres 資料庫
Render → **New → PostgreSQL**（免費 plan）。開好後，喺 Info 頁攞 **Internal Database URL**（`postgres://…`）。

### 2. 後端 Web Service
Render → **New → Web Service**，連你個 GitHub repo `aura-sonica`：

| 設定 | 值 |
|---|---|
| Root Directory | `backend` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

環境變數（Environment）：

| Key | Value |
|---|---|
| `DATABASE_URL` | 上面 Postgres 個 Internal URL |
| `JWT_SECRET` | 用 `python -c "import secrets; print(secrets.token_urlsafe(48))"` 生成（太短或預設值，伺服器會拒絕啟動）|
| `ADMIN_EMAILS` | `VENUSLEUNG412@GMAIL.COM` |
| `CORS_ORIGINS` | 前端網址，例如 `https://aura-sonica.onrender.com` |

（下單 email 通知嘅 SMTP 變數見第 4 節。）

部署好之後，**匯入商品一次**：喺 Render 個 backend service 開 **Shell**，跑 `python seed.py`。

### 3. 前端 Static Site
你原本個 static site（`aura-sonica.onrender.com`）加一個環境變數：

| Key | Value |
|---|---|
| `VITE_API_URL` | 後端 web service 網址，例如 `https://aura-sonica-api.onrender.com` |

Build Command `npm install && npm run build`、Publish Directory `dist`。改完 **Manual Deploy / Clear cache & deploy** 一次令佢食到新變數。

### 4. Email 通知（Gmail）
呢組 SMTP 設定會令：Venus 一有新單收到通知、**客人落單收確認信、Venus 改狀態時客人收通知**。
Venus 個 Gmail 開一個 **App Password（應用程式密碼）**，喺後端加：

| Key | Value |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `venusleung412@gmail.com` |
| `SMTP_PASSWORD` | 16 位 App Password |
| `SMTP_FROM` | `venusleung412@gmail.com` |
| `NOTIFY_EMAIL` | `venusleung412@gmail.com` |

未設都得 —— 落單照樣成功，只係唔會寄信（後端 log 會印出通知內容）。

---

## 前端安全 Header（喺 Render 網站設定，唔喺 code 入面）

Render → Aura-Sonica（Static Site）→ **Headers**，Path 全部係 `/*`：

| Header | Value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://aura-sonica-api.onrender.com; connect-src 'self' https://aura-sonica-api.onrender.com https://fonts.googleapis.com https://fonts.gstatic.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |

⚠️ 如果日後加新嘅外部資源（例如新字體、新圖片網站、第三方 script），要將佢個網址加入上面 CSP 對應嘅位置，否則會被瀏覽器擋。
改之前可以先將 Header 名改成 `Content-Security-Policy-Report-Only` 試，確認冇問題再改返。

---

## 上線前 checklist
- [ ] Postgres 連到、`seed.py` 匯入咗商品
- [ ] 用 `make_admin.py` 開 Venus 嘅管理員帳戶（強密碼）→ 入到 `/#/admin`
- [ ] 落一張測試單 → Venus 收到通知 email
- [ ] `JWT_SECRET` 係隨機生成嘅長字串（唔係預設值會拒絕啟動）
- [ ] 正式環境 `/docs` 應該開唔到（404）
- [ ] 前端 `VITE_API_URL` 指啱後端、重新部署過
- [ ] （日後）Phase 4：接 Stripe 線上付款

---

## 之後想加線上付款（Stripe）
DB `orders` 已經預留咗 `payment_status` / `payment_method` / `stripe_session_id` 欄位，
到時只需加一個 create-checkout endpoint + webhook，唔使改架構。

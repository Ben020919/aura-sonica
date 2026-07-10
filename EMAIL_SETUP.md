# AURA_Sonica 電郵設定教學（SMTP）

## 呢個設定做咩用？
令個網站識**自己寄 email** —— 一次過搞掂晒：
- 客人落單 → 收確認信
- Venus 改訂單狀態 → 客人收通知
- （將來加）註冊驗證碼

全部 email 都靠呢個「寄件人」設定。**未設定之前**，落單照樣成功，只係唔會真寄信（後端 terminal 會印出「本應寄乜」）。

---

## 揀方法

| | 方法 A：Gmail App Password | 方法 B：Resend |
|---|---|---|
| 難度 | ⭐ 最簡單，10 分鐘 | ⭐⭐ 要有自己網域 + 改 DNS |
| 寄件人 | Venus 個 Gmail | 你自己網域（例如 no-reply@aura-sonica.com）|
| 適合 | **起步、小量**（Gmail 每日約 500 封夠用）| 將來做大 / 想專業啲 |

**建議：先用方法 A。** 夠用先，將來想升級再轉方法 B（後端 code 唔使改，淨係換設定）。

---

## 方法 A：Gmail App Password（逐步）

> App Password ＝ 畀個網站一個「專用密碼」去用 Venus 個 Gmail 幫手寄信，唔會用到 Venus 平時登入嘅真密碼。

### Step 1 — 開 Venus Gmail 嘅「兩步驗證」
（一定要先開兩步驗證，先攞到 App Password）
1. 用 **Venus 個 Google 帳戶**登入
2. 去 👉 **myaccount.google.com/security**
3. 搵「**兩步驗證 / 2-Step Verification**」→ 撳入去開啟（跟指示綁電話號碼）

### Step 2 — 攞 App Password（應用程式密碼）
1. 去 👉 **myaccount.google.com/apppasswords**（要開咗兩步驗證先入到）
2. App 名隨便打 **AURA_Sonica** → 撳「建立 / Create」
3. Google 會彈一串 **16 個英文字母**，例如 `abcd efgh ijkl mnop`
4. **即刻抄低佢**（關咗就唔會再顯示）。用嗰陣**去晒空格**：`abcdefghijklmnop`

### Step 3 — 填入後端設定
喺 `backend/` 資料夾：
1. 如果未有 `.env`，先複製一份：`cp .env.example .env`
2. 用文字編輯器開 `backend/.env`，填以下 6 行（`SMTP_PASSWORD` 就係頭先個 16 字碼）：

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=venusleung412@gmail.com
SMTP_PASSWORD=abcdefghijklmnop
SMTP_FROM=venusleung412@gmail.com
NOTIFY_EMAIL=venusleung412@gmail.com
```

> - `SMTP_USER` / `SMTP_FROM`：Venus 個 Gmail 地址（做寄件人）
> - `NOTIFY_EMAIL`：邊個收「有新訂單」通知（一樣填 Venus）
> - `SMTP_PASSWORD`：**唔係** Venus 平時個密碼，係 Step 2 攞嗰個 16 字 App Password

### Step 4 — 測試（本機）
1. 重開後端：`uvicorn app.main:app --reload --port 8000`
2. 落一張測試單（用一個你收到到嘅 email 做客人）
3. 睇後端 terminal：
   - 見到 **`[notify] 已寄通知去 …`** ＝ 🎉 成功寄咗！
   - 仲係見「SMTP 未配置」＝ `.env` 未生效（檢查有冇存檔、有冇重開後端）
   - 見「寄信失敗」＝ App Password 打錯 / 冇去空格 / 兩步驗證未開
4. 去嗰個 email 信箱睇下收唔收到（**第一次好可能喺垃圾郵件**，mark 返「唔係垃圾」就得）

### Step 5 — 上到正式網站（Render）
喺 Render → 後端 service → **Environment**，逐個加返上面 6 個 `KEY=VALUE`（同本機一樣），save → 會自動重新部署。之後正式網站就會真寄信。

---

## 方法 B：Resend（簡介，將來先做）

Resend 係專門寄 transactional email 嘅服務，寄件成功率高、可以用自己網域。**好處**係唔會撞 Gmail 每日上限、唔會咁易入垃圾郵件。

1. 去 **resend.com** 開戶（免費額度：每月 3000 封 / 每日 100 封）
2. **驗證一個網域**（要你有自己個 domain，加幾個 DNS 記錄）—— 冇網域就淨係寄到自己嗰個 email，寄唔到畀客人
3. 攞 Resend 嘅 **SMTP 資料**（佢一樣用 SMTP，所以我哋 code 唔使改），填入 `.env`：
```
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=re_你嘅_API_Key
SMTP_FROM=no-reply@你嘅網域.com
NOTIFY_EMAIL=venusleung412@gmail.com
```
4. 其餘同方法 A 一樣（測試、上 Render）。

> 因為要有網域，一般**起步用方法 A（Gmail）**，做大 / 買咗網域先轉方法 B。

---

## 常見問題

- **收唔到信？** 睇後端 terminal 有冇「寄信失敗」，多數係 App Password 打錯或有空格。
- **入咗垃圾郵件？** 起步好正常，mark not spam；用方法 B + 自己網域會改善。
- **要唔要用 Venus 真密碼？** 唔好！一定要用 App Password（方法 A）或 API Key（方法 B）。
- **App Password 唔見咗？** 去 apppasswords 刪咗舊嗰個、重新建立一個就得。
- **一定要 Gmail？** 唔一定，任何支援 SMTP 嘅郵箱都得（Outlook 等），只係設定值唔同。

搞掂 SMTP 之後，同我講，我就可以幫你加「註冊 email 驗證碼」嗰個功能 🌊

# AURA_Sonica 後端 API

FastAPI + SQLAlchemy。畀 aura-sonica 前端做登入、落單、後台管理。

## 本機開發

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env          # 預設用 SQLite，唔使裝 Postgres
python seed.py                # 匯入商品/分類
uvicorn app.main:app --reload --port 8000
```

- API 文件（Swagger）：http://localhost:8000/docs
- 健康檢查：http://localhost:8000/api/health
- 商品列表：http://localhost:8000/api/products

## 資料庫

- 本機：SQLite（`backend/aura.db`，已 gitignore）。
- Render：Postgres，`DATABASE_URL` 由 Render 自動注入。
  程式會自動將 `postgres://` 改成 SQLAlchemy 要嘅 `postgresql+psycopg2://`。

## 分階段

- [x] Phase 1 — 骨架 + DB models（users / categories / products / orders / order_items / favorites）
- [x] Phase 2 — 真登入註冊（JWT）＋收藏同步 ✅ 前後端 e2e 測通
- [x] Phase 3 — 落單流程 + email 通知 Venus ✅ 前後端 e2e 測通
- [x] Phase 5 — 後台 /admin（商品 CRUD、訂單管理）✅ 前後端 e2e 測通
- [ ] Phase 4 — Stripe 線上付款（客戶要求遲啲先做；DB 已預留欄位）

部署見 [`../DEPLOY.md`](../DEPLOY.md)。

> 註：Phase 1 用 `Base.metadata.create_all` 起表；schema 穩定後會轉 Alembic migration。

#!/usr/bin/env bash
# 🌊 AURA_Sonica 一鍵本機啟動（前端 + 後端）
# 用法：喺 aura-sonica 資料夾開 Terminal，打  ./start.sh
# 停：撳 Ctrl + C（會一齊停埋前後端）

set -e
cd "$(dirname "$0")"
ROOT="$(pwd)"

echo "🌊 AURA_Sonica 本機啟動中…"

# ── 後端（FastAPI, port 8000）──
cd "$ROOT/backend"
if [ ! -d venv ]; then
  echo "→ 第一次：建立 Python 環境 + 安裝套件（等一兩分鐘）…"
  python3 -m venv venv
  ./venv/bin/pip install -q --upgrade pip
  ./venv/bin/pip install -q -r requirements.txt
fi
[ -f .env ] || cp .env.example .env          # 冇 .env 就用範例（SQLite，唔使裝 Postgres）
[ -f aura.db ] || ./venv/bin/python seed.py  # 冇資料庫就匯入商品
echo "→ 後端：http://127.0.0.1:8000  （API 文件：/docs）"
# --reload-dir app：只監視 app/ 程式碼，唔會因為寫 aura.db 就重啟
# --host 127.0.0.1：明確聽 IPv4，同前端 127.0.0.1 對上
./venv/bin/uvicorn app.main:app --reload --reload-dir app --host 127.0.0.1 --port 8000 &
BACK=$!

# Ctrl+C / 收工 → 一齊殺後端
trap 'echo; echo "停緊…"; kill $BACK 2>/dev/null' EXIT INT TERM

# ── 前端（Vite, port 5178）──
cd "$ROOT"
[ -d node_modules ] || { echo "→ 第一次：安裝前端套件（等一兩分鐘）…"; npm install; }
echo "→ 前端：http://localhost:5178"
echo "→ 後台：http://localhost:5178/#/admin"
echo "──────────────────────────────────────────"
npm run dev

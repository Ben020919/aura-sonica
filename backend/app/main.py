from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from . import models  # noqa: F401  —— 令 SQLAlchemy 認得所有 model
from .config import settings
from .database import Base, engine
from .routers import admin, auth, favorites, health, orders, products

# 輕量 migration：現有 SQLite DB 補返新加嘅欄，唔使 reset、保住資料。
# （Prod Postgres 由 create_all 起齊；呢個只喺 SQLite 行、失敗都唔阻啟動。）
_NEW_COLUMNS = {
    "orders": [
        ("order_no", "VARCHAR(20)"),
        ("return_status", "VARCHAR(20)"),
        ("return_no", "VARCHAR(24)"),
        ("return_reason", "TEXT"),
        ("return_note", "TEXT"),
    ],
    "users": [
        ("reset_code", "VARCHAR(6)"),
        ("reset_expires", "DATETIME"),
        ("phone", "VARCHAR(40)"),   # 個人資料（地址簿）
        ("address", "TEXT"),
    ],
}


def _auto_migrate() -> None:
    """現有表補新欄。SQLite 用 PRAGMA 檢查；Postgres（Neon）用 ADD COLUMN IF NOT EXISTS，重複行都安全。"""
    is_sqlite = engine.url.get_backend_name().startswith("sqlite")
    try:
        with engine.begin() as conn:
            for table, cols in _NEW_COLUMNS.items():
                if is_sqlite:
                    existing = {
                        r[1] for r in conn.execute(text(f"PRAGMA table_info({table})"))
                    }
                    for name, ddl in cols:
                        if name not in existing:
                            conn.execute(
                                text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}")
                            )
                else:
                    for name, ddl in cols:
                        pg_ddl = "TIMESTAMP" if ddl.upper() == "DATETIME" else ddl
                        conn.execute(
                            text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {name} {pg_ddl}")
                        )
    except Exception as e:  # noqa: BLE001
        print(f"[migrate] 略過 auto-migrate：{e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)  # 新表
    _auto_migrate()  # 現有表補新欄
    yield


app = FastAPI(title="AURA_Sonica API", version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(favorites.router)
app.include_router(orders.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {"name": "AURA_Sonica API", "docs": "/docs"}

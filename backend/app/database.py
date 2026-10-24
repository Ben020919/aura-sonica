from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import settings

# Render / Neon 畀嘅 URL 係 postgres://… 或 postgresql://…，一律指明用 psycopg2。
# （新版 SQLAlchemy 預設 driver 改咗做 psycopg 3，唔指明就會 ModuleNotFoundError）
db_url = settings.database_url
for prefix in ("postgres://", "postgresql://"):
    if db_url.startswith(prefix):
        db_url = db_url.replace(prefix, "postgresql+psycopg2://", 1)
        break

# SQLite 喺多執行緒（uvicorn）要關 same-thread 檢查
connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()


def get_db():
    """FastAPI 依賴：每個 request 一個 DB session。"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

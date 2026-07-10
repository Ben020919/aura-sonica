from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import settings

# Render 畀嘅 URL 係 postgres://…，SQLAlchemy 要 postgresql+psycopg2://
db_url = settings.database_url
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)

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

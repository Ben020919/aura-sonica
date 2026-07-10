from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """環境設定。由 .env / 環境變數讀取。"""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # 資料庫：本機預設 SQLite；Render 會注入 Postgres 的 DATABASE_URL
    database_url: str = "sqlite:///./aura.db"

    # JWT（Phase 2 登入用）
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 日

    # 前端來源（CORS 白名單），逗號分隔
    cors_origins: str = "http://localhost:5178,http://localhost:5173"

    # 呢啲 email 註冊時自動成為管理員（可入後台），逗號分隔
    admin_emails: str = "VENUSLEUNG412@GMAIL.COM"

    # 下單通知（SMTP；未填就只喺 log 印出，唔會 fail）
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    notify_email: str = "VENUSLEUNG412@GMAIL.COM"  # 收下單通知嘅人（Venus）

    # 運費（HKD，flat；0 = 免運費）
    shipping_fee: float = 0

    # 上載圖片 URL 前綴。本機留空 ""＝相對路徑 /api/images/...（經 vite proxy，同源）。
    # Render（前端靜態站、後端另一個 service）要設成後端網址，例如 https://aura-api.onrender.com
    public_base_url: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def admin_email_set(self) -> set[str]:
        return {e.strip().lower() for e in self.admin_emails.split(",") if e.strip()}


settings = Settings()

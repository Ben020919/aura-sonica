"""建立 / 升級管理員帳戶。

⚠️ 安全：admin 唔可以靠公開註冊嚟開（因為 Venus 個 email 係公開喺網站上）。
    要開 admin，只可以由「能執行呢個 script 嘅人」（即開發者 / 伺服器管理者）做。

用法（喺 backend/ 資料夾入面）:
    ./venv/bin/python make_admin.py <email> <密碼>
    例如：./venv/bin/python make_admin.py venus@gmail.com MyStrongPass123

之後用嗰個 email + 密碼去 /admin 登入就得。
"""
import sys

from app import models
from app.database import Base, SessionLocal, engine
from app.security import hash_password


def run(email: str, password: str) -> None:
    Base.metadata.create_all(bind=engine)
    email = email.strip().lower()
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == email).first()
        if user:
            user.is_admin = True
            user.password_hash = hash_password(password)
            action = "升級咗現有帳戶做管理員（並更新密碼）"
        else:
            user = models.User(
                email=email,
                password_hash=hash_password(password),
                name=email.split("@")[0],
                is_admin=True,
            )
            db.add(user)
            action = "建立咗新管理員帳戶"
        db.commit()
        print(f"✓ {action}：{email}")
        print("  而家去 /admin 用呢個 email + 密碼登入就得。")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("用法: python make_admin.py <email> <密碼>")
        sys.exit(1)
    run(sys.argv[1], sys.argv[2])

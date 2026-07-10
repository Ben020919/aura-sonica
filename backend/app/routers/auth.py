import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user
from ..notifications import format_password_reset, send_email
from ..security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _token_response(user: models.User) -> schemas.Token:
    token = create_access_token(user.id, {"is_admin": user.is_admin})
    return schemas.Token(
        access_token=token, user=schemas.UserOut.model_validate(user)
    )


@router.post("/register", response_model=schemas.Token)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    if db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(status_code=409, detail="呢個 email 已經註冊咗")
    # 安全：公開註冊「永遠唔會」變 admin。
    # admin 只可以由開發者用 `python make_admin.py <email> <密碼>` 開（見該檔）。
    user = models.User(
        email=email,
        password_hash=hash_password(payload.password),
        name=(payload.name or email.split("@")[0]).strip(),
        is_admin=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _token_response(user)


@router.post("/login", response_model=schemas.Token)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email 或密碼唔啱")
    return _token_response(user)


@router.get("/me", response_model=schemas.UserOut)
def me(user: models.User = Depends(get_current_user)):
    return user


@router.post("/forgot")
def forgot_password(
    payload: schemas.ForgotRequest,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """忘記密碼：寄 6 位重設驗證碼去 email（要 SMTP 先真寄）。"""
    email = payload.email.strip().lower()
    user = db.query(models.User).filter(models.User.email == email).first()
    if user:
        code = f"{secrets.randbelow(1000000):06d}"
        user.reset_code = code
        user.reset_expires = datetime.now(timezone.utc) + timedelta(minutes=15)
        db.commit()
        subject, text, html = format_password_reset(user, code)
        background.add_task(send_email, user.email, subject, text, html)
    # 唔透露 email 存唔存在（安全）
    return {"ok": True, "message": "如果呢個 email 有帳戶,驗證碼已寄出。"}


@router.post("/reset", response_model=schemas.Token)
def reset_password(payload: schemas.ResetRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not user.reset_code or user.reset_code != payload.code.strip():
        raise HTTPException(status_code=400, detail="驗證碼唔啱")
    exp = user.reset_expires
    if exp is not None:
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > exp:
            raise HTTPException(status_code=400, detail="驗證碼已過期,請重新申請")
    # 唔准用返舊密碼（同現有密碼一樣就拒絕）
    if verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=400, detail="新密碼唔可以同舊密碼一樣，請設一個新密碼"
        )
    user.password_hash = hash_password(payload.password)
    user.reset_code = None
    user.reset_expires = None
    db.commit()
    db.refresh(user)
    return _token_response(user)  # 重設成功即登入

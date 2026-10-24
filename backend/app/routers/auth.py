import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user
from ..notifications import format_password_reset, send_email
from ..ratelimit import limit, limit_key
from ..security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])

MAX_RESET_ATTEMPTS = 5  # 驗證碼錯 5 次即作廢，要重新申請

# 用嚟令「email 唔存在」都行一次 bcrypt，等回應時間一樣，唔會被人用時間差估到邊個 email 有註冊
_DUMMY_HASH = hash_password("dummy-password-for-timing")


def _bump_token_version(user: models.User) -> None:
    """令呢個用戶所有舊 token 即時失效（改密碼 / 重設密碼時用）。"""
    user.token_version = (user.token_version or 0) + 1


def _token_response(user: models.User) -> schemas.Token:
    token = create_access_token(
        user.id, {"is_admin": user.is_admin, "ver": user.token_version or 0}
    )
    return schemas.Token(
        access_token=token, user=schemas.UserOut.model_validate(user)
    )


@router.post("/register", response_model=schemas.Token)
def register(
    payload: schemas.UserCreate, request: Request, db: Session = Depends(get_db)
):
    limit(request, "register", max_hits=5, window=3600)  # 每個 IP 每小時最多開 5 個帳戶
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
def login(
    payload: schemas.UserLogin, request: Request, db: Session = Depends(get_db)
):
    email = payload.email.strip().lower()
    # 防暴力猜密碼：每個 IP 每分鐘 10 次；每個帳戶 15 分鐘 10 次（換 IP 都冇用）
    limit(request, "login", max_hits=10, window=60)
    limit_key(f"login-email:{email}", max_hits=10, window=900)
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        verify_password(payload.password, _DUMMY_HASH)
        raise HTTPException(status_code=401, detail="Email 或密碼唔啱")
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email 或密碼唔啱")
    return _token_response(user)


@router.get("/me", response_model=schemas.UserOut)
def me(user: models.User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=schemas.UserOut)
def update_me(
    payload: schemas.ProfileUpdate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """更新個人資料（地址簿）：姓名 / 電話 / 收貨地址，落單時自動填好。"""
    if payload.name is not None:
        user.name = payload.name.strip() or None
    if payload.phone is not None:
        user.phone = payload.phone.strip() or None
    if payload.address is not None:
        user.address = payload.address.strip() or None
    db.commit()
    db.refresh(user)
    return user


@router.post("/change-password")
def change_password(
    payload: schemas.PasswordChange,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """登入狀態下改密碼：要輸入現有密碼先改到。改完其他裝置會被登出。"""
    limit_key(f"change-pw:{user.id}", max_hits=5, window=900)
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="現有密碼唔啱")
    if verify_password(payload.new_password, user.password_hash):
        raise HTTPException(status_code=400, detail="新密碼唔可以同現有密碼一樣")
    user.password_hash = hash_password(payload.new_password)
    _bump_token_version(user)
    db.commit()
    db.refresh(user)
    # 回新 token，等而家呢部機唔使重新登入（其他裝置嘅舊 token 已失效）
    return {"ok": True, "message": "密碼已更改", "access_token": _token_response(user).access_token}


@router.post("/forgot")
def forgot_password(
    payload: schemas.ForgotRequest,
    request: Request,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """忘記密碼：寄 6 位重設驗證碼去 email（要 SMTP 先真寄）。"""
    email = payload.email.strip().lower()
    # 防洗信：每個 IP 每小時 10 次；每個 email 每小時 3 次
    limit(request, "forgot", max_hits=10, window=3600)
    limit_key(f"forgot-email:{email}", max_hits=3, window=3600)
    user = db.query(models.User).filter(models.User.email == email).first()
    if user:
        code = f"{secrets.randbelow(1000000):06d}"
        user.reset_code = code
        user.reset_expires = datetime.now(timezone.utc) + timedelta(minutes=15)
        user.reset_attempts = 0
        db.commit()
        subject, text, html = format_password_reset(user, code)
        background.add_task(send_email, user.email, subject, text, html)
    # 唔透露 email 存唔存在（安全）
    return {"ok": True, "message": "如果呢個 email 有帳戶,驗證碼已寄出。"}


@router.post("/reset", response_model=schemas.Token)
def reset_password(
    payload: schemas.ResetRequest, request: Request, db: Session = Depends(get_db)
):
    email = payload.email.strip().lower()
    limit(request, "reset", max_hits=10, window=900)
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not user.reset_code:
        raise HTTPException(status_code=400, detail="驗證碼唔啱或已失效，請重新申請")
    # 6 位數字只有一百萬個組合 —— 一定要限次數，否則可以被人逐個試
    if not secrets.compare_digest(user.reset_code, payload.code.strip()):
        user.reset_attempts = (user.reset_attempts or 0) + 1
        if user.reset_attempts >= MAX_RESET_ATTEMPTS:
            user.reset_code = None
            user.reset_expires = None
            db.commit()
            raise HTTPException(status_code=400, detail="錯得太多次，驗證碼已作廢，請重新申請")
        db.commit()
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
    user.reset_attempts = 0
    _bump_token_version(user)  # 踢走所有舊登入（例如偷咗帳戶嘅人）
    db.commit()
    db.refresh(user)
    return _token_response(user)  # 重設成功即登入

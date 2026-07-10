from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from . import models
from .database import get_db
from .security import decode_token

# 只用嚟由 Authorization: Bearer 標頭抽 token；auto_error=False 由我哋自己出錯誤
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

_CRED_ERR = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="未登入或登入已過期",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    if not token:
        raise _CRED_ERR
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise _CRED_ERR
    user = (
        db.query(models.User)
        .filter(models.User.id == int(payload["sub"]))
        .first()
    )
    if user is None:
        raise _CRED_ERR
    return user


def get_current_admin(
    user: models.User = Depends(get_current_user),
) -> models.User:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="淨係管理員先入到")
    return user

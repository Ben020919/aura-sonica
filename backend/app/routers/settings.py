from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api", tags=["settings"])

# 第一次開站冇資料，就用呢個做預設
DEFAULT_ANNOUNCE = "僅適用於網站購買 : 購物滿港幣200元即享免運費"


def get_or_create(db: Session) -> models.SiteSetting:
    """網站設定永遠得一行（id=1）；未有就即刻起返一行預設值。"""
    row = db.get(models.SiteSetting, 1)
    if row is None:
        row = models.SiteSetting(id=1, announce_text=DEFAULT_ANNOUNCE)
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


@router.get("/settings", response_model=schemas.SiteSettingOut)
def read_settings(db: Session = Depends(get_db)):
    """公開：網站前台讀設定（唔使登入）。"""
    return get_or_create(db)

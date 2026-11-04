from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from .. import models, schemas
from ..config import settings
from ..database import get_db
from ..notifications import format_note, send_email
from ..ratelimit import limit, limit_key

router = APIRouter(prefix="/api", tags=["products"])


@router.post("/note")
def leave_note(
    payload: schemas.NoteIn,
    background: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
):
    """首頁「留言」→ 存入 DB + email 去 Venus。"""
    # 唔使登入都用到，所以要限次數，防止有人洗爆 Venus 個信箱
    limit(request, "note", max_hits=3, window=600)
    limit_key("note:global", max_hits=60, window=3600)
    message = payload.message.strip()
    nickname = (payload.nickname or "").strip() or None
    db.add(models.Note(nickname=nickname, message=message))
    db.commit()
    alias = nickname or "一位路過的旅人"
    subject, text, html = format_note(alias, message)
    background.add_task(send_email, settings.notify_email, subject, text, html)
    return {"ok": True}


@router.post("/track", status_code=204)
def track_view(payload: schemas.PageViewIn, request: Request, db: Session = Depends(get_db)):
    """公開：前台每換一頁打一次，記低瀏覽紀錄（後台「流量」用）。"""
    # 唔使登入，所以都要限次數，防止有人狂打塞爆 DB
    limit(request, "track", max_hits=60, window=60)
    limit_key("track:global", max_hits=20_000, window=3600)
    path = payload.path.split("?")[0].strip()
    if not path.startswith("/") or path.startswith("/admin"):
        return Response(status_code=204)
    db.add(models.PageView(path=path, visitor=payload.visitor.strip()))
    db.commit()
    return Response(status_code=204)


@router.get("/images/{image_id}")
def get_image(image_id: int, db: Session = Depends(get_db)):
    """公開：serve 後台上載嘅圖片（畀商店 <img> 用）。"""
    img = db.query(models.Image).filter(models.Image.id == image_id).first()
    if not img:
        raise HTTPException(status_code=404, detail="搵唔到圖片")
    return Response(
        content=img.data,
        media_type=img.content_type,
        headers={"Cache-Control": "public, max-age=31536000"},
    )


@router.get("/categories", response_model=list[schemas.CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return (
        db.query(models.Category)
        .order_by(models.Category.sort_order, models.Category.id)
        .all()
    )


@router.get("/products", response_model=list[schemas.ProductOut])
def list_products(category: str | None = None, db: Session = Depends(get_db)):
    q = db.query(models.Product).filter(models.Product.is_active.is_(True))
    if category:
        q = q.filter(models.Product.category == category)
    return q.order_by(models.Product.sort_order, models.Product.id).all()


@router.get("/products/{slug}", response_model=schemas.ProductOut)
def get_product(slug: str, db: Session = Depends(get_db)):
    p = (
        db.query(models.Product)
        .filter(models.Product.slug == slug)
        .first()
    )
    if not p:
        raise HTTPException(status_code=404, detail="搵唔到呢件商品")
    return p

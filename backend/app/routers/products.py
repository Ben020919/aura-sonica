from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from .. import models, schemas
from ..config import settings
from ..database import get_db
from ..notifications import format_note, send_email

router = APIRouter(prefix="/api", tags=["products"])


@router.post("/note")
def leave_note(payload: schemas.NoteIn, background: BackgroundTasks):
    """首頁「留言」→ email 去 Venus（用後端 SMTP）。"""
    alias = (payload.nickname or "一位路過的旅人").strip()
    subject, text, html = format_note(alias, payload.message.strip())
    background.add_task(send_email, settings.notify_email, subject, text, html)
    return {"ok": True}


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

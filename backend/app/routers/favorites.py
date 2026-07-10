from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/api/favorites", tags=["favorites"])


def _slugs_for(user: models.User, db: Session) -> list[str]:
    rows = (
        db.query(models.Product.slug)
        .join(models.Favorite, models.Favorite.product_id == models.Product.id)
        .filter(models.Favorite.user_id == user.id)
        .order_by(models.Favorite.created_at)
        .all()
    )
    return [r[0] for r in rows]


@router.get("", response_model=list[str])
def list_favorites(
    user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """回傳目前用戶收藏嘅商品 slug 陣列。"""
    return _slugs_for(user, db)


@router.post("/merge", response_model=list[str])
def merge_favorites(
    slugs: list[str],
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """登入時將本機（未登入時）嘅收藏合併入帳戶。
    ⚠️ 要排喺 /{slug} 之前，否則 "merge" 會被當成 slug。"""
    for slug in slugs:
        product = (
            db.query(models.Product).filter(models.Product.slug == slug).first()
        )
        if not product:
            continue
        existing = (
            db.query(models.Favorite)
            .filter(
                models.Favorite.user_id == user.id,
                models.Favorite.product_id == product.id,
            )
            .first()
        )
        if not existing:
            db.add(models.Favorite(user_id=user.id, product_id=product.id))
    db.commit()
    return _slugs_for(user, db)


@router.post("/{slug}", response_model=list[str])
def add_favorite(
    slug: str,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = db.query(models.Product).filter(models.Product.slug == slug).first()
    if not product:
        raise HTTPException(status_code=404, detail="搵唔到商品")
    existing = (
        db.query(models.Favorite)
        .filter(
            models.Favorite.user_id == user.id,
            models.Favorite.product_id == product.id,
        )
        .first()
    )
    if not existing:
        db.add(models.Favorite(user_id=user.id, product_id=product.id))
        db.commit()
    return _slugs_for(user, db)


@router.delete("/{slug}", response_model=list[str])
def remove_favorite(
    slug: str,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = db.query(models.Product).filter(models.Product.slug == slug).first()
    if product:
        db.query(models.Favorite).filter(
            models.Favorite.user_id == user.id,
            models.Favorite.product_id == product.id,
        ).delete()
        db.commit()
    return _slugs_for(user, db)

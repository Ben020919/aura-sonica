import io
import re

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    UploadFile,
)
from PIL import Image as PILImage
from sqlalchemy.orm import Session

from .. import models, schemas
from ..config import settings
from ..database import get_db
from ..deps import get_current_admin
from ..notifications import (
    format_return_customer,
    format_status_update,
    send_email,
)

# 成個 router 都要管理員權限
router = APIRouter(
    prefix="/api/admin",
    tags=["admin"],
    dependencies=[Depends(get_current_admin)],
)

ORDER_STATUSES = {"new", "paid", "shipped", "done", "cancelled"}
PAYMENT_STATUSES = {"unpaid", "paid", "refunded"}
RETURN_STATUSES = {"requested", "approved", "rejected", "refunded"}


# ── 訂單 ────────────────────────────────────
@router.get("/orders", response_model=list[schemas.OrderOut])
def all_orders(status: str | None = None, db: Session = Depends(get_db)):
    q = db.query(models.Order)
    if status:
        q = q.filter(models.Order.status == status)
    return q.order_by(models.Order.created_at.desc()).all()


@router.patch("/orders/{order_id}", response_model=schemas.OrderOut)
def update_order(
    order_id: int,
    payload: schemas.OrderAdminUpdate,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="搵唔到訂單")
    status_changed = False
    if payload.status is not None:
        if payload.status not in ORDER_STATUSES:
            raise HTTPException(status_code=400, detail=f"唔啱嘅訂單狀態：{payload.status}")
        status_changed = payload.status != order.status
        order.status = payload.status
    if payload.payment_status is not None:
        if payload.payment_status not in PAYMENT_STATUSES:
            raise HTTPException(
                status_code=400, detail=f"唔啱嘅付款狀態：{payload.payment_status}"
            )
        order.payment_status = payload.payment_status

    return_changed = False
    if payload.return_status is not None:
        if payload.return_status not in RETURN_STATUSES:
            raise HTTPException(
                status_code=400, detail=f"唔啱嘅退貨狀態：{payload.return_status}"
            )
        return_changed = payload.return_status != order.return_status
        order.return_status = payload.return_status
        if payload.return_status == "refunded":
            order.payment_status = "refunded"
            for it in order.items:  # 退款＝貨返，回補庫存
                if it.product_id:
                    p = (
                        db.query(models.Product)
                        .filter(models.Product.id == it.product_id)
                        .first()
                    )
                    if p:
                        p.stock += it.quantity
    if payload.return_note is not None:
        order.return_note = payload.return_note

    db.commit()
    db.refresh(order)
    # 有留 email 先寄：訂單狀態變 → 通知；退貨狀態變 → 通知
    if status_changed and order.contact_email:
        subject, text, html = format_status_update(order)
        background.add_task(send_email, order.contact_email, subject, text, html)
    if return_changed and order.contact_email:
        subject, text, html = format_return_customer(order)
        background.add_task(send_email, order.contact_email, subject, text, html)
    return order


# ── 商品 ────────────────────────────────────
@router.get("/products", response_model=list[schemas.ProductOut])
def all_products(db: Session = Depends(get_db)):
    return (
        db.query(models.Product)
        .order_by(models.Product.sort_order, models.Product.id)
        .all()
    )


@router.post("/products", response_model=schemas.ProductOut, status_code=201)
def create_product(payload: schemas.ProductCreate, db: Session = Depends(get_db)):
    if db.query(models.Product).filter(models.Product.slug == payload.slug).first():
        raise HTTPException(status_code=409, detail=f"slug 已存在：{payload.slug}")
    product = models.Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.patch("/products/{product_id}", response_model=schemas.ProductOut)
def update_product(
    product_id: int,
    payload: schemas.ProductUpdate,
    db: Session = Depends(get_db),
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="搵唔到商品")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="搵唔到商品")
    # 保留歷史訂單快照：將引用咗呢件商品嘅 order_item.product_id 設為 NULL
    db.query(models.OrderItem).filter(
        models.OrderItem.product_id == product_id
    ).update({models.OrderItem.product_id: None})
    db.delete(product)
    db.commit()
    return {"ok": True}


# ── 圖片上載 ────────────────────────────────
MAX_UPLOAD = 10 * 1024 * 1024  # 10MB


@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...), db: Session = Depends(get_db)
):
    """後台上載商品圖 → 壓縮縮細 → 存入 DB → 回傳完整 URL。"""
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="冇收到檔案")
    if len(raw) > MAX_UPLOAD:
        raise HTTPException(status_code=413, detail="圖片太大（上限 10MB）")
    try:
        im = PILImage.open(io.BytesIO(raw)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="唔係有效嘅圖片檔")
    im.thumbnail((1200, 1200))  # 縮到最長邊 1200px，慳空間
    buf = io.BytesIO()
    im.save(buf, format="JPEG", quality=85)
    record = models.Image(data=buf.getvalue(), content_type="image/jpeg")
    db.add(record)
    db.commit()
    db.refresh(record)
    return {"url": f"{settings.public_base_url}/api/images/{record.id}"}


# ── 分類 ────────────────────────────────────
def _slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")


@router.get("/categories", response_model=list[schemas.CategoryOut])
def admin_categories(db: Session = Depends(get_db)):
    return (
        db.query(models.Category)
        .order_by(models.Category.sort_order, models.Category.id)
        .all()
    )


@router.post("/categories", response_model=schemas.CategoryOut, status_code=201)
def create_category(payload: schemas.CategoryCreate, db: Session = Depends(get_db)):
    slug = (payload.slug or _slugify(payload.name_en or payload.name)).strip()
    if not slug:  # 中文名冇英文 → 用流水號
        slug = f"cat-{db.query(models.Category).count() + 1}"
    base, n = slug, 2
    while db.query(models.Category).filter(models.Category.slug == slug).first():
        slug, n = f"{base}-{n}", n + 1
    cat = models.Category(
        slug=slug,
        name=payload.name,
        name_en=payload.name_en,
        tagline=payload.tagline,
        cover=payload.cover,
        sort_order=payload.sort_order,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.patch("/categories/{cat_id}", response_model=schemas.CategoryOut)
def update_category(
    cat_id: int, payload: schemas.CategoryUpdate, db: Session = Depends(get_db)
):
    cat = db.query(models.Category).filter(models.Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="搵唔到分類")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(cat, k, v)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/categories/{cat_id}")
def delete_category(cat_id: int, db: Session = Depends(get_db)):
    cat = db.query(models.Category).filter(models.Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="搵唔到分類")
    if (
        db.query(models.Product)
        .filter(models.Product.category == cat.slug)
        .count()
    ):
        raise HTTPException(status_code=400, detail="呢個分類仲有商品，唔可以刪")
    db.delete(cat)
    db.commit()
    return {"ok": True}


# ── 留言 ────────────────────────────────────
@router.get("/notes", response_model=list[schemas.NoteOut])
def all_notes(db: Session = Depends(get_db)):
    """後台睇客人留言（最新喺上）。"""
    return db.query(models.Note).order_by(models.Note.created_at.desc()).all()

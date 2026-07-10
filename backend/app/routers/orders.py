from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

HKT = timezone(timedelta(hours=8))  # 香港時間，用嚟計訂單編號日期

from .. import models, schemas
from ..config import settings
from ..database import get_db
from ..deps import get_current_user
from ..notifications import (
    format_customer_confirmation,
    format_order_email,
    format_return_customer,
    format_return_received_admin,
    send_email,
)

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.post("", response_model=schemas.OrderOut, status_code=201)
def create_order(
    payload: schemas.OrderCreate,
    background: BackgroundTasks,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 訂單編號 = 香港日期 + 當日序號，例如 2026070901
    date_str = datetime.now(HKT).strftime("%Y%m%d")
    seq_today = (
        db.query(models.Order)
        .filter(models.Order.order_no.like(f"{date_str}%"))
        .count()
    )
    order = models.Order(
        order_no=f"{date_str}{seq_today + 1:02d}",
        user_id=user.id,
        status="new",
        payment_status="unpaid",
        payment_method="manual",  # 而家人手收錢；Phase 4 接 Stripe
        currency="HKD",
        contact_name=payload.contact_name.strip(),
        contact_phone=payload.contact_phone.strip(),
        contact_email=payload.contact_email or user.email,
        shipping_address=payload.shipping_address.strip(),
        note=(payload.note.strip() if payload.note else None),
    )

    # 價錢一律以 DB 為準，唔信前端傳嘅價
    subtotal = 0.0
    for line in payload.items:
        product = (
            db.query(models.Product)
            .filter(
                models.Product.slug == line.product_slug,
                models.Product.is_active.is_(True),
            )
            .first()
        )
        if not product:
            raise HTTPException(
                status_code=400,
                detail=f"商品唔存在或已下架：{line.product_slug}",
            )
        if product.stock < line.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"「{product.name}」庫存不足（剩 {product.stock} 件）",
            )
        product.stock -= line.quantity  # 落單即扣庫存，唔會賣超
        line_total = float(product.price) * line.quantity
        subtotal += line_total
        order.items.append(
            models.OrderItem(
                product_id=product.id,
                product_slug=product.slug,
                product_name=product.name,
                unit_price=product.price,
                quantity=line.quantity,
                line_total=line_total,
            )
        )

    order.subtotal = subtotal
    order.shipping_fee = settings.shipping_fee
    order.total = subtotal + settings.shipping_fee

    db.add(order)
    db.commit()
    db.refresh(order)

    # 背景寄通知（唔阻住回應；寄唔到都唔影響落單）
    subject, text, html = format_order_email(order)
    background.add_task(send_email, settings.notify_email, subject, text, html)

    # 客人確認信（有留 email 先寄）
    if order.contact_email:
        c_subject, c_text, c_html = format_customer_confirmation(order)
        background.add_task(send_email, order.contact_email, c_subject, c_text, c_html)

    return order


@router.get("", response_model=list[schemas.OrderOut])
def my_orders(
    user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return (
        db.query(models.Order)
        .filter(models.Order.user_id == user.id)
        .order_by(models.Order.created_at.desc())
        .all()
    )


@router.get("/{order_id}", response_model=schemas.OrderOut)
def get_order(
    order_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order or (order.user_id != user.id and not user.is_admin):
        raise HTTPException(status_code=404, detail="搵唔到訂單")
    return order


@router.post("/{order_id}/return", response_model=schemas.OrderOut)
def request_return(
    order_id: int,
    payload: schemas.ReturnCreate,
    background: BackgroundTasks,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """客人申請退貨。"""
    order = (
        db.query(models.Order)
        .filter(models.Order.id == order_id, models.Order.user_id == user.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="搵唔到訂單")
    if order.status == "cancelled":
        raise HTTPException(status_code=400, detail="已取消嘅訂單唔可以申請退貨")
    if order.return_status in ("requested", "approved", "refunded"):
        raise HTTPException(status_code=400, detail="呢張訂單已經有退貨申請")
    order.return_status = "requested"
    order.return_no = f"R{order.order_no}"
    order.return_reason = payload.reason.strip()
    db.commit()
    db.refresh(order)
    # 通知 Venus + 覆客人
    s, st, sh = format_return_received_admin(order)
    background.add_task(send_email, settings.notify_email, s, st, sh)
    if order.contact_email:
        cs, ct, ch = format_return_customer(order)
        background.add_task(send_email, order.contact_email, cs, ct, ch)
    return order


@router.post("/{order_id}/cancel", response_model=schemas.OrderOut)
def cancel_order(
    order_id: int,
    background: BackgroundTasks,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """客人自行取消訂單（只限未處理／未出貨嘅新訂單）。"""
    order = (
        db.query(models.Order)
        .filter(models.Order.id == order_id, models.Order.user_id == user.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="搵唔到訂單")
    if order.status != "new":
        raise HTTPException(
            status_code=400, detail="訂單已處理中，唔可以自行取消，請聯絡我哋"
        )
    order.status = "cancelled"
    # 回補庫存
    for it in order.items:
        if it.product_id:
            p = (
                db.query(models.Product)
                .filter(models.Product.id == it.product_id)
                .first()
            )
            if p:
                p.stock += it.quantity
    db.commit()
    db.refresh(order)
    background.add_task(
        send_email,
        settings.notify_email,
        f"【AURA_Sonica】訂單 {order.order_no} 已被客人取消",
        f"{order.contact_name} 取消咗訂單 {order.order_no}（HKD {order.total}）。",
    )
    return order

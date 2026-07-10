from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    LargeBinary,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from .database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(120))
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=_utcnow, nullable=False)

    # 忘記密碼：重設驗證碼 + 到期時間
    reset_code = Column(String(6))
    reset_expires = Column(DateTime)

    orders = relationship("Order", back_populates="user")
    favorites = relationship(
        "Favorite", back_populates="user", cascade="all, delete-orphan"
    )


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True)
    slug = Column(String(40), unique=True, index=True, nullable=False)  # bag | grip
    name = Column(String(80), nullable=False)
    name_en = Column(String(80))
    tagline = Column(String(200))
    cover = Column(String(300))
    sort_order = Column(Integer, default=0, nullable=False)


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True)
    slug = Column(String(80), unique=True, index=True, nullable=False)  # e.g. bag-cloud
    name = Column(String(200), nullable=False)
    name_en = Column(String(200))
    category = Column(String(40), index=True, nullable=False)  # bag | grip
    price = Column(Numeric(10, 2), nullable=False)  # HKD
    currency = Column(String(8), default="HKD", nullable=False)
    img = Column(String(300))
    gallery = Column(JSON, default=list)  # list[str] 圖片路徑
    tags = Column(JSON, default=list)  # list[str]
    note = Column(Text)
    stock = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=_utcnow, nullable=False)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow, nullable=False)


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True)
    order_no = Column(String(20), unique=True, index=True)  # 例如 2026070901（日期+當日序號）
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String(20), default="new", nullable=False)
    # new | paid | shipped | done | cancelled

    # —— 付款相關：預留畀將來 Stripe，而家人手收錢 ——
    payment_status = Column(String(20), default="unpaid", nullable=False)
    # unpaid | paid | refunded
    payment_method = Column(String(20))  # manual | stripe
    stripe_session_id = Column(String(200))

    subtotal = Column(Numeric(10, 2), default=0, nullable=False)
    shipping_fee = Column(Numeric(10, 2), default=0, nullable=False)
    total = Column(Numeric(10, 2), default=0, nullable=False)
    currency = Column(String(8), default="HKD", nullable=False)

    # 收貨/聯絡資料
    contact_name = Column(String(120), nullable=False)
    contact_phone = Column(String(40), nullable=False)
    contact_email = Column(String(255))
    shipping_address = Column(Text, nullable=False)
    note = Column(Text)

    # 退貨（客人申請 → 後台審批 → 退款）
    return_status = Column(String(20))  # None｜requested｜approved｜rejected｜refunded
    return_no = Column(String(24), index=True)  # 退貨編號，例如 R2026070901
    return_reason = Column(Text)  # 客人填嘅退貨原因
    return_note = Column(Text)  # 後台備註：退貨編號/寄件方式，或拒絕原因

    created_at = Column(DateTime, default=_utcnow, nullable=False)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow, nullable=False)

    user = relationship("User", back_populates="orders")
    items = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))  # 可為空（商品日後刪咗）
    # 落單一刻嘅快照，避免日後改價/改名影響歷史訂單
    product_slug = Column(String(80))
    product_name = Column(String(200), nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    line_total = Column(Numeric(10, 2), nullable=False)

    order = relationship("Order", back_populates="items")


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    created_at = Column(DateTime, default=_utcnow, nullable=False)

    user = relationship("User", back_populates="favorites")


class Image(Base):
    """後台上載嘅商品圖，存喺 DB（Render 重新部署都唔會唔見，唔使外部儲存）。"""

    __tablename__ = "images"

    id = Column(Integer, primary_key=True)
    data = Column(LargeBinary, nullable=False)
    content_type = Column(String(50), default="image/jpeg", nullable=False)
    created_at = Column(DateTime, default=_utcnow, nullable=False)

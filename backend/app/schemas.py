from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ── 分類 / 商品 ──────────────────────────────
class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    name: str
    name_en: str | None = None
    tagline: str | None = None
    cover: str | None = None


class NoteIn(BaseModel):
    nickname: str | None = None
    message: str = Field(min_length=1)


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    name: str
    name_en: str | None = None
    category: str
    price: float
    currency: str
    img: str | None = None
    gallery: list[str] = []
    tags: list[str] = []
    note: str | None = None
    stock: int
    is_active: bool


# ── 認證 ────────────────────────────────────
class UserCreate(BaseModel):
    name: str | None = None
    email: EmailStr
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    name: str | None = None
    is_admin: bool


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ForgotRequest(BaseModel):
    email: EmailStr


class ResetRequest(BaseModel):
    email: EmailStr
    code: str
    password: str = Field(min_length=6)


# ── 訂單 ────────────────────────────────────
class OrderItemIn(BaseModel):
    product_slug: str
    quantity: int = Field(ge=1, le=99)


class OrderCreate(BaseModel):
    items: list[OrderItemIn] = Field(min_length=1)
    contact_name: str = Field(min_length=1)
    contact_phone: str = Field(min_length=1)
    contact_email: EmailStr | None = None
    shipping_address: str = Field(min_length=1)
    note: str | None = None


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_slug: str | None = None
    product_name: str
    unit_price: float
    quantity: int
    line_total: float


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_no: str | None = None
    status: str
    payment_status: str
    payment_method: str | None = None
    subtotal: float
    shipping_fee: float
    total: float
    currency: str
    contact_name: str
    contact_phone: str
    contact_email: str | None = None
    shipping_address: str
    note: str | None = None
    return_status: str | None = None
    return_no: str | None = None
    return_reason: str | None = None
    return_note: str | None = None
    created_at: datetime
    items: list[OrderItemOut] = []


class ReturnCreate(BaseModel):
    reason: str = Field(min_length=1)


# ── 後台（管理員）──────────────────────────
class OrderAdminUpdate(BaseModel):
    status: str | None = None
    payment_status: str | None = None
    return_status: str | None = None
    return_note: str | None = None


class ProductCreate(BaseModel):
    slug: str = Field(min_length=1)
    name: str = Field(min_length=1)
    name_en: str | None = None
    category: str = Field(min_length=1)
    price: float = Field(ge=0)
    img: str | None = None
    gallery: list[str] = []
    tags: list[str] = []
    note: str | None = None
    stock: int = Field(default=0, ge=0)
    is_active: bool = True
    sort_order: int = 0


class ProductUpdate(BaseModel):
    name: str | None = None
    name_en: str | None = None
    category: str | None = None
    price: float | None = Field(default=None, ge=0)
    img: str | None = None
    gallery: list[str] | None = None
    tags: list[str] | None = None
    note: str | None = None
    stock: int | None = Field(default=None, ge=0)
    is_active: bool | None = None
    sort_order: int | None = None


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1)
    name_en: str | None = None
    tagline: str | None = None
    cover: str | None = None
    slug: str | None = None  # 唔畀就後端自動生成
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    name: str | None = None
    name_en: str | None = None
    tagline: str | None = None
    cover: str | None = None
    sort_order: int | None = None

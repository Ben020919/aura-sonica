"""將商品/分類匯入資料庫（對應 src/data/products.js）。

用法（喺 backend/ 入面，venv 已 activate）:
    python seed.py

可以重複跑：有就更新、冇就新增（upsert），唔會整重複。
之後 Venus 喺後台改嘅嘢係 source of truth，呢個 script 淨係用嚟起底 / 補回。
"""
from app import models
from app.database import Base, SessionLocal, engine

CATEGORIES = [
    {
        "slug": "bag",
        "name": "絨面袋",
        "name_en": "Satin Pouch",
        "tagline": "把海的溫柔挽在手中",
        "cover": "/products/1.jpeg",
    },
    {
        "slug": "grip",
        "name": "手機支架",
        "name_en": "Phone Grip",
        "tagline": "一枚貝殼，托住你的日常",
        "cover": "/products/8.jpeg",
    },
]

PRODUCTS = [
    # —— 絨面袋 ——
    {
        "slug": "bag-cloud",
        "category": "bag",
        "name": "AURA 緞面貝殼袋 · 雲白",
        "name_en": "Satin Shell Pouch — Cloud",
        "price": 198,
        "img": "/products/1.jpeg",
        "gallery": ["/products/1.jpeg", "/products/2.jpeg", "/products/3.jpeg"],
        "tags": ["絨面袋", "緞面", "手挽", "雲白", "AURA"],
        "note": "柔軟緞面手挽袋，燙印 Aura 手寫字。像把一整片海挽在臂彎。",
    },
    {
        "slug": "bag-breeze",
        "category": "bag",
        "name": "AURA 緞面貝殼袋 · 微風",
        "name_en": "Satin Shell Pouch — Breeze",
        "price": 198,
        "img": "/products/2.jpeg",
        "gallery": ["/products/2.jpeg", "/products/3.jpeg", "/products/1.jpeg"],
        "tags": ["絨面袋", "緞面", "手挽", "微風"],
        "note": "日常容量剛好，放得下手機、鑰匙同你未說出口的心事。",
    },
    {
        "slug": "bag-pearl",
        "category": "bag",
        "name": "AURA 緞面貝殼袋 · 珍珠",
        "name_en": "Satin Shell Pouch — Pearl",
        "price": 218,
        "img": "/products/3.jpeg",
        "gallery": ["/products/3.jpeg", "/products/1.jpeg", "/products/2.jpeg"],
        "tags": ["絨面袋", "緞面", "珍珠", "限量"],
        "note": "珍珠光澤緞布，光線一動就像海面在呼吸。",
    },
    # —— 手機支架 ——
    {
        "slug": "grip-shell-sea",
        "category": "grip",
        "name": "Aura 貝殼手機支架 · 海藍",
        "name_en": "Shell Phone Grip — Sea",
        "price": 128,
        "img": "/products/8.jpeg",
        "gallery": ["/products/8.jpeg", "/products/9.jpeg", "/products/10.jpeg"],
        "tags": ["手機支架", "貝殼", "海藍", "氣囊"],
        "note": "海藍貝殼氣囊支架，握住手機時像握住一小片潮汐。",
    },
    {
        "slug": "grip-shell-cloud",
        "category": "grip",
        "name": "Aura 貝殼手機支架 · 雲白",
        "name_en": "Shell Phone Grip — Cloud",
        "price": 128,
        "img": "/products/9.jpeg",
        "gallery": ["/products/9.jpeg", "/products/10.jpeg", "/products/8.jpeg"],
        "tags": ["手機支架", "貝殼", "雲白"],
        "note": "雲白貝殼，低調襯任何手機殼，日常最耐看的一枚。",
    },
    {
        "slug": "grip-heart-lavender",
        "category": "grip",
        "name": "Aura 愛心手機支架 · 薰衣草",
        "name_en": "Heart Phone Grip — Lavender",
        "price": 138,
        "img": "/products/5.jpeg",
        "gallery": ["/products/5.jpeg", "/products/6.jpeg", "/products/4.jpeg"],
        "tags": ["手機支架", "愛心", "薰衣草", "紫"],
        "note": "薰衣草愛心，流動紋理像被海水洗過的紫水晶。",
    },
    {
        "slug": "grip-heart-lilac",
        "category": "grip",
        "name": "Aura 愛心手機支架 · 紫貝",
        "name_en": "Heart Phone Grip — Lilac",
        "price": 138,
        "img": "/products/6.jpeg",
        "gallery": ["/products/6.jpeg", "/products/4.jpeg", "/products/5.jpeg"],
        "tags": ["手機支架", "愛心", "紫貝", "限量"],
        "note": "紫貝愛心，光澤更深一點，像黃昏時分的海。",
    },
]

DEFAULT_STOCK = 20


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for i, c in enumerate(CATEGORIES):
            obj = db.query(models.Category).filter_by(slug=c["slug"]).first()
            if obj is None:
                obj = models.Category(slug=c["slug"])
                db.add(obj)
            obj.name = c["name"]
            obj.name_en = c["name_en"]
            obj.tagline = c["tagline"]
            obj.cover = c["cover"]
            obj.sort_order = i

        for i, p in enumerate(PRODUCTS):
            obj = db.query(models.Product).filter_by(slug=p["slug"]).first()
            if obj is None:
                obj = models.Product(slug=p["slug"], stock=DEFAULT_STOCK)
                db.add(obj)
            obj.name = p["name"]
            obj.name_en = p["name_en"]
            obj.category = p["category"]
            obj.price = p["price"]
            obj.img = p["img"]
            obj.gallery = p["gallery"]
            obj.tags = p["tags"]
            obj.note = p["note"]
            obj.sort_order = i
            obj.is_active = True

        db.commit()
        print(f"✓ Seeded {len(CATEGORIES)} categories, {len(PRODUCTS)} products.")
    finally:
        db.close()


if __name__ == "__main__":
    run()

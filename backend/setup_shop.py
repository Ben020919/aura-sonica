"""一次過設定 Store 嘅分類 + 5 件產品（含多圖 gallery）。

本地跑（改 aura.db）:
    cd backend && ./venv/bin/python setup_shop.py

上線跑（改 Neon）:
    cd backend && DATABASE_URL="<你嘅 Neon 連線字串>" ./venv/bin/python setup_shop.py

安全：只會 upsert 呢 5 件 + 3 分類，其餘舊產品設為下架（唔刪，保住訂單紀錄）。
"""

from sqlalchemy.orm import Session

from app import models
from app.database import Base, engine

CATEGORIES = [
    {"slug": "bag", "name": "Tote Bag", "name_en": "Tote",
     "tagline": "把一整片海，挽在臂彎", "cover": "/products/1.jpeg", "sort_order": 1},
    {"slug": "grip", "name": "手機支架", "name_en": "Phone Stand",
     "tagline": "一枚貝殼，托住你的日常", "cover": "/products/8.jpeg", "sort_order": 2},
    {"slug": "figure", "name": "AURA 公仔", "name_en": "Figure",
     "tagline": "忘聲海最深貝殼裡的她", "cover": "/products/figure-front.jpeg", "sort_order": 3},
]

PRODUCTS = [
    {
        "slug": "tote-suede", "name": "Suede Tote Bag", "name_en": "Suede Tote Bag",
        "category": "bag", "price": 68, "stock": 50, "sort_order": 1,
        "img": "/products/1.jpeg",
        "gallery": ["/products/1.jpeg", "/products/2.jpeg", "/products/3.jpeg"],
        "note": "柔軟緞面手挽袋，燙印 Aura 手寫字。像把一整片海挽在臂彎。",
    },
    {
        "slug": "stand-blue", "name": "Phone Stand · 海藍", "name_en": "Phone Stand — Sea Blue",
        "category": "grip", "price": 20, "stock": 50, "sort_order": 2,
        "img": "/products/8.jpeg",
        "gallery": ["/products/8.jpeg", "/products/9.jpeg", "/products/10.jpeg"],
        "note": "海藍貝殼氣囊支架，握住手機時像握住一小片潮汐。",
    },
    {
        "slug": "stand-purple", "name": "Phone Stand · 薰衣草", "name_en": "Phone Stand — Lavender",
        "category": "grip", "price": 20, "stock": 50, "sort_order": 3,
        "img": "/products/5.jpeg",
        "gallery": ["/products/5.jpeg", "/products/6.jpeg", "/products/4.jpeg"],
        "note": "薰衣草貝殼，流動紋理像被海水洗過的紫水晶。",
    },
    {
        "slug": "figure-aura", "name": "AURA Model Figure · 海洋藍", "name_en": "AURA Model Figure — Ocean Blue",
        "category": "figure", "price": 599, "stock": 20, "sort_order": 4,
        "img": "/products/figure-front.jpeg",
        "gallery": [
            "/products/figure-front.jpeg", "/products/figure-left.jpeg",
            "/products/figure-right.jpeg", "/products/figure-back.jpeg",
        ],
        "note": "AURA 原創 IP 珍藏公仔・海洋藍。手抱漸變藍貝殼、戴上耳機，靜靜聽你今天過得好不好。"
                "前後左右每一面，都是海的細節。",
    },
    {
        "slug": "figure-white", "name": "AURA Model Figure · 珍珠白", "name_en": "AURA Model Figure — Pearl White",
        "category": "figure", "price": 599, "stock": 20, "sort_order": 5,
        "img": "/products/figure-white-front.jpeg",
        "gallery": [
            "/products/figure-white-front.jpeg", "/products/figure-white-left.jpeg",
            "/products/figure-white-right.jpeg", "/products/figure-white-back.jpeg",
        ],
        "note": "AURA 原創 IP 珍藏公仔・珍珠白。抱著雪白貝殼、綴上珍珠，像忘聲海清晨第一道光。"
                "前後左右每一面，都是海的細節。",
    },
]


def run() -> None:
    Base.metadata.create_all(bind=engine)
    db = Session(engine)
    try:
        keep = {p["slug"] for p in PRODUCTS}
        for c in CATEGORIES:
            row = db.query(models.Category).filter_by(slug=c["slug"]).first()
            if row:
                for k, v in c.items():
                    setattr(row, k, v)
            else:
                db.add(models.Category(**c))
        for p in PRODUCTS:
            row = db.query(models.Product).filter_by(slug=p["slug"]).first()
            if row:
                for k, v in p.items():
                    setattr(row, k, v)
                row.is_active = True
            else:
                db.add(models.Product(is_active=True, **p))
        # 其餘舊產品下架（唔刪，保住歷史訂單）
        for row in db.query(models.Product).all():
            if row.slug not in keep:
                row.is_active = False
        db.commit()
        print(f"✓ 設定完成：{len(CATEGORIES)} 分類 + {len(PRODUCTS)} 件產品；其餘舊產品已下架")
        for p in (
            db.query(models.Product)
            .filter_by(is_active=True)
            .order_by(models.Product.category, models.Product.sort_order)
            .all()
        ):
            print(f"  · [{p.category}] {p.name} — HKD {p.price} — {len(p.gallery or [])} 圖")
    finally:
        db.close()


if __name__ == "__main__":
    run()

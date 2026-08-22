"""一次過設定 Store 嘅分類 + 12 件產品（含多圖 gallery）。

本地跑（改 aura.db）:
    cd backend && ./venv/bin/python setup_shop.py

上線跑（改 Neon）:
    cd backend && DATABASE_URL="<你嘅 Neon 連線字串>" ./venv/bin/python setup_shop.py

安全：只會 upsert 呢 12 件 + 5 分類，其餘舊產品設為下架（唔刪，保住訂單紀錄）。
"""

from sqlalchemy.orm import Session

from app import models
from app.database import Base, engine

CATEGORIES = [
    {"slug": "bag", "name": "Tote Bag", "name_en": "Tote",
     "tagline": "把一整片海，挽在臂彎", "cover": "/products/tote-1.jpeg", "sort_order": 1},
    {"slug": "grip", "name": "手機支架", "name_en": "Phone Stand",
     "tagline": "一枚貝殼，托住你的日常", "cover": "/products/stand-blue-1.jpeg", "sort_order": 2},
    {"slug": "figure", "name": "AURA 公仔", "name_en": "Figure",
     "tagline": "忘聲海最深貝殼裡的她", "cover": "/products/figure-v2-front.jpeg", "sort_order": 3},
    {"slug": "tee", "name": "T-Shirt", "name_en": "Tee",
     "tagline": "把海浪穿在身上", "cover": "/products/tee-blue-1.jpeg", "sort_order": 4},
    {"slug": "stationery", "name": "文具", "name_en": "Stationery",
     "tagline": "寫低，未說出口的話", "cover": "/products/sticker-1.jpeg", "sort_order": 5},
]

PRODUCTS = [
    {
        "slug": "tote-suede", "name": "Suede Tote Bag", "name_en": "Suede Tote Bag",
        "category": "bag", "price": 68, "stock": 50, "sort_order": 1,
        "img": "/products/tote-1.jpeg",
        "gallery": ["/products/tote-1.jpeg", "/products/tote-2.jpeg", "/products/tote-3.jpeg"],
        "note": "柔軟緞面手挽袋，燙印 Aura 手寫字。像把一整片海挽在臂彎。",
    },
    {
        "slug": "stand-blue", "name": "Phone Stand", "name_en": "Phone Stand",
        "category": "grip", "price": 20, "stock": 50, "sort_order": 2,
        "img": "/products/stand-blue-1.jpeg",
        "gallery": ["/products/stand-blue-1.jpeg", "/products/stand-blue-2.jpeg", "/products/stand-blue-3.jpeg"],
        "note": "海藍貝殼氣囊支架，握住手機時像握住一小片潮汐。",
    },
    {
        "slug": "stand-purple", "name": "Phone Stand", "name_en": "Phone Stand",
        "category": "grip", "price": 20, "stock": 50, "sort_order": 3,
        "img": "/products/stand-purple-1.jpeg",
        "gallery": ["/products/stand-purple-1.jpeg", "/products/stand-purple-2.jpeg", "/products/stand-purple-3.jpeg"],
        "note": "薰衣草貝殼，流動紋理像被海水洗過的紫水晶。",
    },
    {
        "slug": "figure-aura", "name": "AURA Model Figure", "name_en": "AURA Model Figure",
        "category": "figure", "price": 599, "stock": 20, "sort_order": 4,
        "img": "/products/figure-v2-front.jpeg",
        "gallery": [
            "/products/figure-v2-front.jpeg", "/products/figure-v2-left.jpeg",
            "/products/figure-v2-right.jpeg", "/products/figure-v2-back.jpeg",
        ],
        "note": "AURA 原創 IP 珍藏公仔・海洋藍。手抱漸變藍貝殼、戴上耳機，靜靜聽你今天過得好不好。"
                "前後左右每一面，都是海的細節。",
    },
    {
        "slug": "figure-white", "name": "AURA Model Figure", "name_en": "AURA Model Figure",
        "category": "figure", "price": 599, "stock": 20, "sort_order": 5,
        "img": "/products/figure-v2-white-front.jpeg",
        "gallery": [
            "/products/figure-v2-white-front.jpeg", "/products/figure-v2-white-left.jpeg",
            "/products/figure-v2-white-right.jpeg", "/products/figure-v2-white-back.jpeg",
        ],
        "note": "AURA 原創 IP 珍藏公仔・珍珠白。抱著雪白貝殼、綴上珍珠，像忘聲海清晨第一道光。"
                "前後左右每一面，都是海的細節。",
    },
    {
        "slug": "tee-blue", "name": "Unisex T-Shirt", "name_en": "Unisex T-Shirt — Blue (Cooling)",
        "category": "tee", "price": 238, "stock": 50, "sort_order": 6,
        "img": "/products/tee-blue-1.jpeg",
        "gallery": ["/products/tee-blue-1.jpeg", "/products/tee-blue-2.jpeg", "/products/tee-blue-3.jpeg"],
        "note": "涼感 Unisex T-Shirt・霧藍。涼感布料透氣貼服，似把一片清晨的海穿在身上。",
    },
    {
        "slug": "tee-white", "name": "Unisex T-Shirt", "name_en": "Unisex T-Shirt — White (Oversize)",
        "category": "tee", "price": 238, "stock": 50, "sort_order": 7,
        "img": "/products/tee-white-1.jpeg",
        "gallery": ["/products/tee-white-1.jpeg", "/products/tee-white-2.jpeg", "/products/tee-white-3.jpeg"],
        "note": "Oversize Unisex T-Shirt・白。寬鬆落肩，背後印住 Listen to the wave within。",
    },
    {
        "slug": "tee-short", "name": "Short T-Shirt (For Girls)", "name_en": "Short T-Shirt (For Girls)",
        "category": "tee", "price": 168, "stock": 50, "sort_order": 8,
        "img": "/products/tee-short-1.jpeg",
        "gallery": ["/products/tee-short-1.jpeg"],
        "note": "女生短版 T-Shirt，俐落好搭，襯高腰啱啱好。",
    },
    {
        "slug": "postcard-portrait", "name": "Post Card", "name_en": "Post Card — Portrait",
        "category": "stationery", "price": 12, "stock": 100, "sort_order": 9,
        "img": "/products/postcard-1.jpeg",
        "gallery": ["/products/postcard-1.jpeg"],
        "note": "AURA 明信片・直度，$12 一張。寄畀遠方嘅人，或者未來嘅自己。",
    },
    {
        "slug": "postcard-landscape", "name": "Post Card", "name_en": "Post Card — Landscape",
        "category": "stationery", "price": 12, "stock": 100, "sort_order": 10,
        "img": "/products/postcard-2.jpeg",
        "gallery": ["/products/postcard-2.jpeg"],
        "note": "AURA 明信片・橫度，$12 一張。寄畀遠方嘅人，或者未來嘅自己。",
    },
    {
        "slug": "sticker", "name": "Sticker", "name_en": "Sticker",
        "category": "stationery", "price": 12, "stock": 100, "sort_order": 11,
        "img": "/products/sticker-1.jpeg",
        "gallery": ["/products/sticker-1.jpeg"],
        "note": "AURA 貼紙，$12 一個。貼喺電腦、水樽、日記，海就喺身邊。",
    },
    {
        "slug": "memopad", "name": "Memopad", "name_en": "Memopad",
        "category": "stationery", "price": 22, "stock": 100, "sort_order": 12,
        "img": "/products/memopad-1.jpeg",
        "gallery": ["/products/memopad-1.jpeg"],
        "note": "AURA Memopad，$22 一個。寫低每一句想講但未講嘅話。",
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

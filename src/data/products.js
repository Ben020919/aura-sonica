// 商品資料 —— Venus 日後改名 / 改價 / 換相就喺呢度改
// price 單位: HKD。img 對應 public/products/ 入面嘅相片。

export const CATEGORIES = [
  {
    id: 'bag',
    name: '絨面袋',
    en: 'Satin Pouch',
    tagline: '把海的溫柔挽在手中',
    cover: '/products/1.jpeg',
  },
  {
    id: 'grip',
    name: '手機支架',
    en: 'Phone Grip',
    tagline: '一枚貝殼，托住你的日常',
    cover: '/products/8.jpeg',
  },
]

export const PRODUCTS = [
  // ── 絨面袋 ──────────────────────────────
  {
    id: 'bag-cloud',
    cat: 'bag',
    name: 'AURA 緞面貝殼袋 · 雲白',
    en: 'Satin Shell Pouch — Cloud',
    price: 198,
    img: '/products/1.jpeg',
    gallery: ['/products/1.jpeg', '/products/2.jpeg', '/products/3.jpeg'],
    tags: ['絨面袋', '緞面', '手挽', '雲白', 'AURA'],
    note: '柔軟緞面手挽袋，燙印 Aura 手寫字。像把一整片海挽在臂彎。',
  },
  {
    id: 'bag-breeze',
    cat: 'bag',
    name: 'AURA 緞面貝殼袋 · 微風',
    en: 'Satin Shell Pouch — Breeze',
    price: 198,
    img: '/products/2.jpeg',
    gallery: ['/products/2.jpeg', '/products/3.jpeg', '/products/1.jpeg'],
    tags: ['絨面袋', '緞面', '手挽', '微風'],
    note: '日常容量剛好，放得下手機、鑰匙同你未說出口的心事。',
  },
  {
    id: 'bag-pearl',
    cat: 'bag',
    name: 'AURA 緞面貝殼袋 · 珍珠',
    en: 'Satin Shell Pouch — Pearl',
    price: 218,
    img: '/products/3.jpeg',
    gallery: ['/products/3.jpeg', '/products/1.jpeg', '/products/2.jpeg'],
    tags: ['絨面袋', '緞面', '珍珠', '限量'],
    note: '珍珠光澤緞布，光線一動就像海面在呼吸。',
  },
  // ── 手機支架 ────────────────────────────
  {
    id: 'grip-shell-sea',
    cat: 'grip',
    name: 'Aura 貝殼手機支架 · 海藍',
    en: 'Shell Phone Grip — Sea',
    price: 128,
    img: '/products/8.jpeg',
    gallery: ['/products/8.jpeg', '/products/9.jpeg', '/products/10.jpeg'],
    tags: ['手機支架', '貝殼', '海藍', '氣囊'],
    note: '海藍貝殼氣囊支架，握住手機時像握住一小片潮汐。',
  },
  {
    id: 'grip-shell-cloud',
    cat: 'grip',
    name: 'Aura 貝殼手機支架 · 雲白',
    en: 'Shell Phone Grip — Cloud',
    price: 128,
    img: '/products/9.jpeg',
    gallery: ['/products/9.jpeg', '/products/10.jpeg', '/products/8.jpeg'],
    tags: ['手機支架', '貝殼', '雲白'],
    note: '雲白貝殼，低調襯任何手機殼，日常最耐看的一枚。',
  },
  {
    id: 'grip-heart-lavender',
    cat: 'grip',
    name: 'Aura 愛心手機支架 · 薰衣草',
    en: 'Heart Phone Grip — Lavender',
    price: 138,
    img: '/products/5.jpeg',
    gallery: ['/products/5.jpeg', '/products/6.jpeg', '/products/4.jpeg'],
    tags: ['手機支架', '愛心', '薰衣草', '紫'],
    note: '薰衣草愛心，流動紋理像被海水洗過的紫水晶。',
  },
  {
    id: 'grip-heart-lilac',
    cat: 'grip',
    name: 'Aura 愛心手機支架 · 紫貝',
    en: 'Heart Phone Grip — Lilac',
    price: 138,
    img: '/products/6.jpeg',
    gallery: ['/products/6.jpeg', '/products/4.jpeg', '/products/5.jpeg'],
    tags: ['手機支架', '愛心', '紫貝', '限量'],
    note: '紫貝愛心，光澤更深一點，像黃昏時分的海。',
  },
]

export function productsByCat(catId) {
  return PRODUCTS.filter((p) => p.cat === catId)
}

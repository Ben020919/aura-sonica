// 套裝價（要同後端 app/routers/orders.py 嘅 BUNDLE_PRICES 一致）
// 而家冇套裝價；日後有（例：2 張 $X）就加返入嚟
export const BUNDLES = {}

export function lineTotal(slug, unitPrice, qty) {
  const b = BUNDLES[slug]
  if (!b) return unitPrice * qty
  const sets = Math.floor(qty / b.perSet)
  const rem = qty % b.perSet
  return sets * b.setPrice + rem * unitPrice
}

// 機能の公開スイッチ。false の間は利用者向け画面に「準備中」を表示する。
// true に戻すと元の画面がそのまま表示される。
// ※占い師の商品登録(/provider/goods)と運営の商品管理(/admin/products)には影響しない
export const FEATURES = {
  goods: false, // 開運グッズ(/goods, /goods/[id], /cart)
  palm: false, // AI手相(/palm, /palm/result/[id])
} as const;

export type FeatureKey = keyof typeof FEATURES;

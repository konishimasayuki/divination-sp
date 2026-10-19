import type { Provider } from "./providers-data";
import type { Product } from "./products";
import type { HistoryItem, Order, Settings } from "./types";

// total=売上 / fee=システム手数料 / pay=先生の報酬(売上−手数料)
export type Revenue = { video: number; voice: number; msg: number; gift: number; goods: number; total: number; fee: number; pay: number };

// この先生のシステム手数料率(%)。個別設定がなければ運営の標準値
export function feeOf(p: Provider | undefined | null, settings: Settings) {
  return p?.feeRate != null ? p.feeRate : settings.feeRate ?? 20;
}

// この先生の取り分(%) = 100 − 手数料
export function rateOf(p: Provider | undefined | null, settings: Settings) {
  return 100 - feeOf(p, settings);
}

// 先生に使われたポイント(売上)と、手数料・報酬。
// 手数料は取引ごとに記録した手数料率で計算し、記録がない取引は今の手数料率(fallbackFee)で計算する
export function revenueOf(pid: string, hist: HistoryItem[], orders: Order[], products: Product[], fallbackFee: number, from = 0, to = Infinity): Revenue {
  const r: Revenue = { video: 0, voice: 0, msg: 0, gift: 0, goods: 0, total: 0, fee: 0, pay: 0 };
  for (const h of hist) {
    if (h.providerId !== pid || h.points >= 0 || h.createdAt < from || h.createdAt >= to) continue;
    const v = Math.abs(h.points);
    if (h.kind === "talk") (h.label.includes("音声") ? (r.voice += v) : (r.video += v));
    else if (h.kind === "msg") r.msg += v;
    else if (h.kind === "gift") r.gift += v;
    else continue;
    r.fee += (v * (h.fee ?? fallbackFee)) / 100;
  }
  for (const o of orders) {
    if (o.createdAt < from || o.createdAt >= to) continue;
    for (const it of o.items) {
      const prod = products.find((x) => x.id === it.productId);
      const owner = it.providerId ?? prod?.providerId;
      if (owner !== pid) continue;
      const v = (it.points ?? prod?.points ?? 0) * it.qty;
      r.goods += v;
      r.fee += (v * (it.fee ?? fallbackFee)) / 100;
    }
  }
  r.total = r.video + r.voice + r.msg + r.gift + r.goods;
  r.fee = Math.round(r.fee);
  r.pay = r.total - r.fee;
  return r;
}

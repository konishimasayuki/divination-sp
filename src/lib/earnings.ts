import type { Provider } from "./providers-data";
import type { Product } from "./products";
import type { HistoryItem, Order, Settings } from "./types";

export type Revenue = { video: number; voice: number; msg: number; gift: number; goods: number; total: number; pay: number };

// この先生の分配率(%)。個別設定がなければ運営の標準値
export function rateOf(p: Provider | undefined | null, settings: Settings) {
  return p?.shareRate != null ? p.shareRate : settings.shareRate;
}

// 先生に使われたポイント(売上)と、先生の取り分(pay)。
// 取り分は取引ごとに記録した分配率で計算し、記録がない古い取引は今の分配率(fallbackRate)で計算する
export function revenueOf(pid: string, hist: HistoryItem[], orders: Order[], products: Product[], fallbackRate: number, from = 0, to = Infinity): Revenue {
  const r: Revenue = { video: 0, voice: 0, msg: 0, gift: 0, goods: 0, total: 0, pay: 0 };
  for (const h of hist) {
    if (h.providerId !== pid || h.points >= 0 || h.createdAt < from || h.createdAt >= to) continue;
    const v = Math.abs(h.points);
    if (h.kind === "talk") (h.label.includes("音声") ? (r.voice += v) : (r.video += v));
    else if (h.kind === "msg") r.msg += v;
    else if (h.kind === "gift") r.gift += v;
    else continue;
    r.pay += (v * (h.rate ?? fallbackRate)) / 100;
  }
  for (const o of orders) {
    if (o.createdAt < from || o.createdAt >= to) continue;
    for (const it of o.items) {
      const prod = products.find((x) => x.id === it.productId);
      const owner = it.providerId ?? prod?.providerId;
      if (owner !== pid) continue;
      const v = (it.points ?? prod?.points ?? 0) * it.qty;
      r.goods += v;
      r.pay += (v * (it.rate ?? fallbackRate)) / 100;
    }
  }
  r.total = r.video + r.voice + r.msg + r.gift + r.goods;
  r.pay = Math.round(r.pay);
  return r;
}

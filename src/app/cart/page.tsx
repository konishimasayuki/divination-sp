"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, useGuard } from "@/lib/store";
import { productMap } from "@/lib/products";
import { add, fmtPt } from "@/lib/db";
import { BackHeader, Loading, Screen } from "@/components/ui";

export default function Cart() {
  const ok = useGuard("user");
  const router = useRouter();
  const { user, cart, setCartQty, clearCart, spend, saveUser } = useApp();
  const [address, setAddress] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!ok || !user) return <Screen><Loading /></Screen>;

  const lines = cart.filter((c) => productMap[c.productId]);
  const total = lines.reduce((s, c) => s + productMap[c.productId].points * c.qty, 0);
  const addr = address ?? user.address ?? "";

  async function order() {
    if (!user || !lines.length) return;
    if (!addr.trim()) {
      setError("お届け先を入力してください");
      return;
    }
    setBusy(true);
    setError("");
    const label = lines.length === 1 ? productMap[lines[0].productId].name : `${productMap[lines[0].productId].name} ほか${lines.length - 1}点`;
    const paid = await spend(total, { kind: "goods", label, detail: "グッズ注文" });
    if (!paid) {
      setBusy(false);
      setError("ポイントが不足しています");
      return;
    }
    await add("orders", { userId: user.id, items: lines, total, address: addr.trim() });
    if (addr !== user.address) await saveUser({ address: addr.trim() });
    clearCart();
    router.replace("/history");
  }

  return (
    <Screen
      bottom={
        lines.length > 0 ? (
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <div className="text-[11px] text-mute">お支払い</div>
              <div className="text-xl font-bold text-gold">{fmtPt(total)}</div>
            </div>
            {user.points < total ? (
              <Link href="/points" className="flex h-[52px] flex-1 items-center justify-center rounded-[14px] bg-gold text-[15px] font-bold text-ink">ポイントを購入する</Link>
            ) : (
              <button onClick={order} disabled={busy} className="flex h-[52px] flex-1 items-center justify-center rounded-[14px] bg-gold text-[15px] font-bold text-ink disabled:opacity-40">
                {busy ? "注文しています" : "ポイントで注文する"}
              </button>
            )}
          </div>
        ) : undefined
      }
    >
      <BackHeader title="カート" href="/goods" />
      {lines.length === 0 ? (
        <div className="px-8 py-16 text-center">
          <p className="text-sm text-mute">カートは空です</p>
          <Link href="/goods" className="mt-3 inline-block text-sm text-gold">グッズを見る</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5 px-4 pb-6">
          {lines.map((c) => {
            const p = productMap[c.productId];
            return (
              <div key={c.productId} className="flex gap-3 rounded-2xl border border-line bg-card p-3">
                <img src={p.image} alt="" className="h-[76px] w-[76px] rounded-xl object-cover" />
                <div className="flex flex-1 flex-col justify-between">
                  <div className="text-sm font-medium leading-snug">{p.name}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-bold text-gold">{fmtPt(p.points * c.qty)}</span>
                    <div className="flex items-center rounded-[10px] border border-edge">
                      <button onClick={() => setCartQty(c.productId, c.qty - 1)} aria-label="数量を減らす" className="h-[34px] w-9 text-lg">−</button>
                      <span className="w-5 text-center text-sm font-bold">{c.qty}</span>
                      <button onClick={() => setCartQty(c.productId, Math.min(9, c.qty + 1))} aria-label="数量を増やす" className="h-[34px] w-9 text-lg">+</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="flex flex-col gap-1.5 rounded-2xl border border-line bg-card px-4 py-3.5">
            <label htmlFor="addr" className="text-[13px] font-medium text-lav">お届け先</label>
            <textarea id="addr" rows={3} value={addr} onChange={(e) => setAddress(e.target.value)} placeholder={"〒000-0000\n住所・お名前"} className="resize-none rounded-xl border border-edge bg-night px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-gold" />
          </div>
          <div className="flex flex-col gap-2 rounded-2xl border border-line bg-card px-4 py-3.5 text-[13px]">
            <div className="flex justify-between"><span className="text-mute">商品合計</span><span>{fmtPt(total)}</span></div>
            <div className="flex justify-between"><span className="text-mute">送料</span><span>無料(デモ)</span></div>
            <div className="flex justify-between"><span className="text-mute">保有ポイント</span><span>{fmtPt(user.points)}</span></div>
          </div>
          {error && <p className="text-xs text-rose">{error}</p>}
        </div>
      )}
    </Screen>
  );
}

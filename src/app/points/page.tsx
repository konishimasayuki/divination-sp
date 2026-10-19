"use client";

import { useEffect, useState } from "react";
import { useApp, useGuard } from "@/lib/store";
import { fmtPt } from "@/lib/db";
import { BackHeader, Loading, Screen, btnGold } from "@/components/ui";

export default function Points() {
  const ok = useGuard("user");
  const { user, settings } = useApp();
  const [sel, setSel] = useState(1);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/env-status").then((r) => r.json()).then((s) => setReady(!!s.paypay && !!s.upstash)).catch(() => setReady(false));
  }, []);
  if (!ok || !user) return <Screen><Loading /></Screen>;
  const packs = settings.packs;
  const cur = packs[Math.min(sel, packs.length - 1)];

  // PayPayの支払いページへ移動。支払い後は /points/complete に戻り、そこでポイントが付与される
  async function buy() {
    if (!cur || !user) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/paypay/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, pack: Math.min(sel, packs.length - 1) }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "PayPay決済を開始できませんでした");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "PayPay決済を開始できませんでした");
      setBusy(false);
    }
  }

  return (
    <Screen
      bottom={
        <div className="flex flex-col gap-2">
          {error && <p className="text-center text-xs text-rose">{error}</p>}
          <button onClick={buy} disabled={busy || !ready} className={`${btnGold} w-full`}>
            {busy ? "PayPayへ移動しています" : `PayPayで ¥${cur?.price.toLocaleString()} を支払う`}
          </button>
          <div className="text-center text-[11px] text-dim">
            {ready === false ? "PayPay決済は現在準備中です" : "PayPayアプリまたはPayPayの画面でお支払いいただけます"}
          </div>
        </div>
      }
    >
      <BackHeader title="ポイント購入" />
      <div className="mx-4 mt-1 flex items-end justify-between rounded-[20px] border border-line bg-card p-[18px]">
        <div>
          <div className="text-xs text-mute">現在の保有ポイント</div>
          <div className="mt-1 text-[32px] font-bold text-gold">
            {user.points.toLocaleString()}
            <span className="ml-1 text-[15px]">pt</span>
          </div>
        </div>
        <div className="text-right text-[11px] text-mute">1pt = 1円相当</div>
      </div>

      <div className="mx-5 mb-2.5 mt-[22px] text-[13px] font-medium text-lav">購入するポイント</div>
      <div className="mx-4 flex flex-col gap-2.5">
        {packs.map((p, i) => {
          const on = sel === i;
          const bonus = p.points - p.price;
          return (
            <button key={i} onClick={() => setSel(i)} className={`flex h-[72px] items-center justify-between rounded-2xl border px-[18px] text-left ${on ? "border-gold bg-deep" : "border-line bg-card"}`}>
              <span className="flex items-center gap-3">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${on ? "border-gold" : "border-faint"}`}>
                  {on && <span className="h-2.5 w-2.5 rounded-full bg-gold" />}
                </span>
                <span>
                  <span className="block text-lg font-bold">{fmtPt(p.points)}</span>
                  {bonus > 0 && <span className="mt-0.5 block text-[11px] text-mint-hi">{fmtPt(bonus)} おトク</span>}
                </span>
              </span>
              <span className="text-[17px] font-bold">¥{p.price.toLocaleString()}</span>
            </button>
          );
        })}
      </div>

      <div className="mx-5 mb-2.5 mt-[22px] text-[13px] font-medium text-lav">お支払い方法</div>
      <div className="mx-4 mb-6 flex h-14 items-center gap-3 rounded-2xl border border-gold bg-deep px-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF0033] text-[11px] font-bold text-white">P</span>
        <span className="flex-1 text-sm font-bold">PayPay</span>
        <span className="text-[11px] text-mute">お支払いはPayPayのみ</span>
      </div>
    </Screen>
  );
}

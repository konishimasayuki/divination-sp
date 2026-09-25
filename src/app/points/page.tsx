"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, useGuard } from "@/lib/store";
import { fmtPt } from "@/lib/db";
import { ICardPay } from "@/components/icons";
import { BackHeader, Loading, Screen, btnGold } from "@/components/ui";

export default function Points() {
  const ok = useGuard("user");
  const router = useRouter();
  const { user, settings, gain } = useApp();
  const [sel, setSel] = useState(1);
  const [busy, setBusy] = useState(false);
  if (!ok || !user) return <Screen><Loading /></Screen>;
  const packs = settings.packs;
  const cur = packs[Math.min(sel, packs.length - 1)];

  async function buy() {
    if (!cur) return;
    setBusy(true);
    // TODO: Stripe Checkout 接続後は決済完了(Webhook)でポイントを付与する
    await gain(cur.points, { kind: "buy", label: `ポイント購入 ${fmtPt(cur.points)}`, detail: `¥${cur.price.toLocaleString()}(テスト決済)` });
    setBusy(false);
    router.back();
  }

  return (
    <Screen
      bottom={
        <div className="flex flex-col gap-2">
          <button onClick={buy} disabled={busy} className={`${btnGold} w-full`}>
            {busy ? "処理しています" : `¥${cur?.price.toLocaleString()} で購入する`}
          </button>
          <div className="text-center text-[11px] text-dim">現在はテスト決済です(Stripe接続後に実際の決済になります)</div>
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
      <div className="mx-4 flex h-14 items-center gap-3 rounded-2xl border border-line bg-card px-4 pb-0">
        <ICardPay size={24} className="text-gold" />
        <span className="flex-1 text-sm">クレジットカード(Stripe)</span>
      </div>
    </Screen>
  );
}

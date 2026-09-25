"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { add, fmtPt, threadIdOf } from "@/lib/db";
import type { Provider } from "@/lib/providers-data";

export const GIFTS = [
  { name: "ひとしずく", pt: 100, tint: "#B8AED8" },
  { name: "小さな星", pt: 300, tint: "#9BE6C0" },
  { name: "満ちる月", pt: 500, tint: "#7FB7E8" },
  { name: "流れ星", pt: 1000, tint: "#E07A8B" },
  { name: "泉の光", pt: 3000, tint: "#D9A04A" },
  { name: "天の川", pt: 5000, tint: "#E8B866" },
];

export function GiftSheet({ provider, onClose, onSent }: { provider: Provider; onClose: () => void; onSent: (label: string) => void }) {
  const { user, spend } = useApp();
  const [sel, setSel] = useState(2);
  const [busy, setBusy] = useState(false);
  if (!user) return null;
  const g = GIFTS[sel];
  const left = user.points - g.pt;

  async function send() {
    if (!user) return;
    setBusy(true);
    const ok = await spend(g.pt, { kind: "gift", providerId: provider.id, label: `${provider.name} へ感謝`, detail: g.name });
    if (ok) {
      await add("messages", {
        threadId: threadIdOf(user.id, provider.id),
        userId: user.id,
        providerId: provider.id,
        from: "user",
        text: `「${g.name}」(${fmtPt(g.pt)})の感謝を贈りました`,
        cost: g.pt,
      });
      onSent(`${fmtPt(g.pt)} の感謝を贈りました`);
      onClose();
    }
    setBusy(false);
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end">
      <button aria-label="閉じる" onClick={onClose} className="absolute inset-0 bg-[rgba(11,8,24,0.72)]" />
      <div className="relative flex flex-col gap-4 rounded-t-[28px] border-t border-line bg-night px-5 pt-3" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}>
        <span className="mx-auto h-1 w-10 rounded bg-edge" />
        <div>
          <div className="font-mincho text-xl font-bold">{provider.name}に感謝を贈る</div>
          <div className="mt-1 text-xs text-mute">贈ったポイントは先生に届き、メッセージにも記録されます</div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {GIFTS.map((x, i) => (
            <button key={x.name} onClick={() => setSel(i)} className={`flex h-[88px] flex-col items-center justify-center gap-1.5 rounded-2xl border ${sel === i ? "border-gold bg-deep" : "border-line bg-card"}`}>
              <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full text-ink" style={{ background: x.tint }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z" /></svg>
              </span>
              <span className="text-xs">{x.name}</span>
              <span className="text-[13px] font-bold text-gold">{fmtPt(x.pt)}</span>
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-mute">
          <span>保有 {fmtPt(user.points)}</span>
          <span>{left >= 0 ? `贈った後 ${fmtPt(left)}` : "ポイントが足りません"}</span>
        </div>
        {left >= 0 ? (
          <button onClick={send} disabled={busy} className="flex h-[54px] items-center justify-center rounded-2xl bg-gold text-base font-bold text-ink disabled:opacity-40">
            {busy ? "贈っています" : `${fmtPt(g.pt)} を贈る`}
          </button>
        ) : (
          <Link href="/points" className="flex h-[54px] items-center justify-center rounded-2xl bg-gold text-base font-bold text-ink">ポイントを購入する</Link>
        )}
      </div>
    </div>
  );
}

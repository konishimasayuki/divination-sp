"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { fmtPt, list, update } from "@/lib/db";
import type { HistoryItem, Payout } from "@/lib/types";
import { AdminShell, panel } from "@/components/AdminShell";

export default function AdminPayout() {
  const { settings } = useApp();
  const [hist, setHist] = useState<HistoryItem[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);

  useEffect(() => {
    list<HistoryItem>("history").then(setHist);
    list<Payout>("payouts").then((p) => setPayouts(p.sort((a, b) => b.createdAt - a.createdAt)));
  }, []);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const month = hist.filter((h) => h.createdAt >= monthStart);
  const spent = month.filter((h) => h.points < 0);
  const total = spent.reduce((s, h) => s + Math.abs(h.points), 0);
  const tellerShare = Math.round(spent.filter((h) => h.providerId).reduce((s, h) => s + Math.abs(h.points), 0) * (settings.shareRate / 100));
  const bought = month.filter((h) => h.kind === "buy").reduce((s, h) => s + h.points, 0);
  const cats: [string, (h: HistoryItem) => boolean][] = [
    ["ビデオ通話", (h) => h.kind === "talk" && !h.label.includes("音声")],
    ["音声通話", (h) => h.kind === "talk" && h.label.includes("音声")],
    ["メッセージ", (h) => h.kind === "msg"],
    ["グッズ", (h) => h.kind === "goods"],
    ["AI手相", (h) => h.kind === "palm"],
    ["感謝(投げ銭)", (h) => h.kind === "gift"],
  ];

  async function approve(p: Payout) {
    await update("payouts", p.id, { status: "approved" });
    setPayouts(payouts.map((x) => (x.id === p.id ? { ...x, status: "approved" } : x)));
  }

  return (
    <AdminShell title="売上・出金" sub={`${now.getFullYear()}年${now.getMonth() + 1}月`}>
      <div className="grid gap-3 md:grid-cols-3">
        <div className={panel}>
          <div className="text-[13px] text-mute">今月のポイント消費(売上)</div>
          <div className="mt-1.5 text-[28px] font-bold text-gold">{fmtPt(total)}</div>
        </div>
        <div className={panel}>
          <div className="text-[13px] text-mute">占い師への支払い予定</div>
          <div className="mt-1.5 text-[28px] font-bold">{fmtPt(tellerShare)}</div>
          <div className="mt-1 text-xs text-mute">分配率 {settings.shareRate}% で算出</div>
        </div>
        <div className={panel}>
          <div className="text-[13px] text-mute">今月のポイント販売</div>
          <div className="mt-1.5 text-[28px] font-bold">{fmtPt(bought)}</div>
          <div className="mt-1 text-xs text-mute">Stripe決済手数料は別途</div>
        </div>
      </div>

      <div className="mt-3.5 grid gap-3.5 xl:grid-cols-[1fr_1.6fr]">
        <div className={`${panel} flex flex-col gap-4`}>
          <span className="text-[15px] font-bold">売上の内訳</span>
          {cats.map(([label, fn]) => {
            const v = spent.filter(fn).reduce((s, h) => s + Math.abs(h.points), 0);
            return (
              <div key={label}>
                <div className="flex justify-between text-[13px]"><span>{label}</span><span className="font-bold">{fmtPt(v)}</span></div>
                <div className="mt-1.5 h-2 rounded bg-[#251F45]">
                  <div className="h-2 rounded bg-gold" style={{ width: `${total ? (v / total) * 100 : 0}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className={`${panel} overflow-x-auto`}>
          <div className="mb-2.5 text-[15px] font-bold">出金申請</div>
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="text-xs text-dim">
              <tr className="border-b border-deep"><th className="py-2 font-normal">占い師</th><th className="font-normal">申請日</th><th className="text-right font-normal">金額</th><th className="text-right font-normal">操作</th></tr>
            </thead>
            <tbody>
              {payouts.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-mute">出金申請はありません</td></tr>}
              {payouts.map((p) => (
                <tr key={p.id} className="border-b border-[#211B3E]">
                  <td className="py-2.5 font-bold">{p.providerName}</td>
                  <td className="text-lav">{new Date(p.createdAt).toLocaleDateString("ja-JP")}</td>
                  <td className="text-right font-bold">{fmtPt(p.amount)}</td>
                  <td className="text-right">
                    {p.status === "pending" ? (
                      <button onClick={() => approve(p)} className="h-[34px] rounded-lg bg-gold px-4 text-[13px] font-bold text-ink">承認する</button>
                    ) : (
                      <span className="text-xs text-mint-hi">承認済み</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2.5 text-xs text-dim">承認後の振込は現在は手動です(Stripe Connectでの自動送金は今後対応)。</p>
        </div>
      </div>
    </AdminShell>
  );
}

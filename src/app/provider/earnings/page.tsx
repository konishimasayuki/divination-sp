"use client";

import { useEffect, useState } from "react";
import { useProviderMe } from "@/lib/useProviderMe";
import { add, fmtDate, fmtPt, list } from "@/lib/db";
import type { Booking, HistoryItem, Payout } from "@/lib/types";
import { IBank } from "@/components/icons";
import { BackHeader, Loading, Screen, btnGold } from "@/components/ui";

export default function Earnings() {
  const { ok, me, app } = useProviderMe();
  const [hist, setHist] = useState<HistoryItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [bank, setBank] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!me) return;
    list<HistoryItem>("history", { providerId: me.id }).then(setHist);
    list<Booking>("bookings", { providerId: me.id }).then(setBookings);
    list<Payout>("payouts", { providerId: me.id }).then((p) => setPayouts(p.sort((a, b) => b.createdAt - a.createdAt)));
  }, [me]);

  if (!ok || !me) return <Screen><Loading /></Screen>;
  const share = app.settings.shareRate / 100;
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
    const sum = hist.filter((h) => h.createdAt >= d.getTime() && h.createdAt < end).reduce((s, h) => s + Math.abs(h.points), 0);
    return { label: `${d.getMonth() + 1}月`, value: Math.round(sum * share) };
  });
  const max = Math.max(1, ...months.map((m) => m.value));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const cur = hist.filter((h) => h.createdAt >= monthStart);
  const byKind = (fn: (h: HistoryItem) => boolean) => Math.round(cur.filter(fn).reduce((s, h) => s + Math.abs(h.points), 0) * share);
  const isVoice = (h: HistoryItem) => h.kind === "talk" && h.label.includes("音声");
  const total = months[5].value;
  const lifetime = Math.round(hist.reduce((s, h) => s + Math.abs(h.points), 0) * share);
  const paid = payouts.reduce((s, p) => s + p.amount, 0);
  const withdrawable = Math.max(0, lifetime - paid);
  const bankVal = bank ?? me.bankInfo ?? "";

  async function request() {
    if (!me || withdrawable <= 0) return;
    if (!bankVal.trim()) {
      setMsg("振込先を入力してください");
      return;
    }
    await app.saveProvider(me.id, { bankInfo: bankVal.trim() });
    const p = await add<Payout>("payouts", { providerId: me.id, providerName: me.name, amount: withdrawable, status: "pending" });
    setPayouts([p, ...payouts]);
    setMsg("出金を申請しました。運営の承認後にお振込みします。");
  }

  return (
    <Screen
      bottom={
        <button onClick={request} disabled={withdrawable <= 0} className={`${btnGold} w-full`}>
          {withdrawable > 0 ? `${fmtPt(withdrawable)} の出金を申請する` : "申請できる報酬はありません"}
        </button>
      }
    >
      <BackHeader title="報酬・出金" href="/provider" />
      <div className="mx-4 rounded-[20px] border border-line bg-card p-[18px]">
        <div className="text-xs text-mute">今月の報酬見込み(分配率 {app.settings.shareRate}% 適用後)</div>
        <div className="mt-1 text-[32px] font-bold text-gold">{fmtPt(total)}</div>
        <div className="mt-3.5 flex h-24 items-end gap-3">
          {months.map((m, i) => (
            <div key={m.label} className="flex flex-1 flex-col items-center gap-1.5">
              <div className={`w-full rounded-md ${i === 5 ? "bg-gold" : "bg-edge"}`} style={{ height: `${Math.max(4, (m.value / max) * 66)}px` }} />
              <span className={`text-[10px] ${i === 5 ? "text-gold" : "text-mute"}`}>{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-5 mb-2 mt-4 text-[13px] font-medium text-lav">今月の内訳 ・ 鑑定 {bookings.filter((b) => b.createdAt >= monthStart).length}件</div>
      <div className="mx-4 overflow-hidden rounded-2xl bg-card">
        {[
          ["ビデオ通話", byKind((h) => h.kind === "talk" && !isVoice(h))],
          ["音声通話", byKind(isVoice)],
          ["メッセージ", byKind((h) => h.kind === "msg")],
          ["いただいた感謝", byKind((h) => h.kind === "gift")],
        ].map(([k, v], i) => (
          <div key={k as string} className={`flex h-[46px] items-center justify-between px-4 text-sm ${i < 3 ? "border-b border-deep" : ""}`}>
            <span>{k}</span>
            <span className={`font-bold ${i === 3 ? "text-gold" : ""}`}>{fmtPt(v as number)}</span>
          </div>
        ))}
      </div>

      <div className="mx-4 mt-4 flex items-center gap-3 rounded-2xl bg-card px-4 py-3">
        <IBank className="shrink-0 text-gold" />
        <div className="flex-1">
          <label htmlFor="bank" className="text-xs text-mute">振込先</label>
          <input id="bank" value={bankVal} onChange={(e) => setBank(e.target.value)} placeholder="銀行名・支店・口座番号・名義" className="mt-0.5 w-full bg-transparent text-sm outline-none" />
        </div>
      </div>
      {msg && <p className="mx-5 mt-2 text-xs text-mint-hi">{msg}</p>}

      <div className="mx-5 mb-2 mt-4 text-[13px] font-medium text-lav">出金の履歴</div>
      <div className="mx-4 mb-6 flex flex-col gap-1.5">
        {payouts.length === 0 && <p className="text-xs text-mute">まだ出金の申請はありません</p>}
        {payouts.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-xl bg-card px-3.5 py-2.5 text-sm">
            <span className="text-mute">{fmtDate(p.createdAt)}</span>
            <span className="font-bold">{fmtPt(p.amount)}</span>
            <span className={`text-xs ${p.status === "approved" ? "text-mint-hi" : "text-gold"}`}>{p.status === "approved" ? "振込済み" : "承認待ち"}</span>
          </div>
        ))}
      </div>
    </Screen>
  );
}

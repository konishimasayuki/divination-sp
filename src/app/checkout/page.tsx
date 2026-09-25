"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, useGuard } from "@/lib/store";
import { add, fmtDay, fmtPt, threadIdOf } from "@/lib/db";
import type { Booking } from "@/lib/types";
import { IInfo } from "@/components/icons";
import { BackHeader, Loading, Screen, btnGold } from "@/components/ui";

type Draft = { providerId: string; method: "video" | "voice"; minutes: number; date: string; time: string; points: number };

function endTime(time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number);
  const t = h * 60 + m + minutes;
  return `${String(Math.floor(t / 60) % 24).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

export default function Checkout() {
  const ok = useGuard("user");
  const router = useRouter();
  const { user, providers, settings, spend } = useApp();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem("booking_draft");
    if (raw) setDraft(JSON.parse(raw));
  }, []);

  if (!ok || !user) return <Screen><Loading /></Screen>;
  if (!draft) return <Screen><BackHeader title="予約内容の確認" href="/tellers" /><Loading label="予約内容がありません" /></Screen>;
  const p = providers.find((x) => x.id === draft.providerId);
  if (!p) return <Screen><Loading /></Screen>;
  const after = user.points - draft.points;

  async function confirm() {
    if (!draft || !p || !user) return;
    setBusy(true);
    setError("");
    const label = `${p.name} ・ ${draft.method === "video" ? "ビデオ" : "音声"}${draft.minutes}分`;
    const paid = await spend(draft.points, { kind: "talk", providerId: p.id, label, detail: `${fmtDay(draft.date)} ${draft.time} 予約` });
    if (!paid) {
      setBusy(false);
      setError("ポイントが不足しています");
      return;
    }
    const booking = await add<Booking>("bookings", {
      userId: user.id,
      userName: user.name,
      providerId: p.id,
      providerName: p.name,
      method: draft.method,
      minutes: draft.minutes,
      date: draft.date,
      time: draft.time,
      points: draft.points,
      channel: `booking-${Date.now()}`,
      status: "reserved",
      note,
    });
    await add("messages", {
      threadId: threadIdOf(user.id, p.id),
      userId: user.id,
      providerId: p.id,
      from: "system",
      bookingId: booking.id,
      text: `${draft.minutes}分 ${draft.method === "video" ? "ビデオ" : "音声"}鑑定のご予約が確定しました。${fmtDay(draft.date)} ${draft.time}〜${endTime(draft.time, draft.minutes)}`,
    });
    if (note.trim()) {
      await add("messages", { threadId: threadIdOf(user.id, p.id), userId: user.id, providerId: p.id, from: "user", text: `【事前の相談内容】${note.trim()}`, cost: 0 });
    }
    sessionStorage.removeItem("booking_draft");
    router.replace(`/messages/${p.id}`);
  }

  return (
    <Screen
      bottom={
        after < 0 ? (
          <Link href="/points" className={`${btnGold}`}>ポイントを購入する(あと{fmtPt(-after)})</Link>
        ) : (
          <button onClick={confirm} disabled={busy} className={`${btnGold} w-full`}>
            {busy ? "予約しています" : `${fmtPt(draft.points)} で予約を確定する`}
          </button>
        )
      }
    >
      <BackHeader title="予約内容の確認" />
      <div className="flex flex-col gap-3.5 px-4 pb-6">
        <div className="flex flex-col gap-3.5 rounded-[20px] border border-line bg-card p-4">
          <div className="flex items-center gap-3">
            <img src={p.photo} alt="" className="h-[52px] w-[52px] rounded-full object-cover" />
            <div>
              <div className="text-base font-bold">{p.name}</div>
              <div className="text-xs text-mute">{p.tag}</div>
            </div>
          </div>
          <div className="flex flex-col gap-2.5 border-t border-deep pt-3 text-sm">
            <div className="flex justify-between"><span className="text-mute">相談方法</span><span>{draft.method === "video" ? "ビデオ通話" : "音声通話(顔出しなし)"}</span></div>
            <div className="flex justify-between"><span className="text-mute">コース</span><span>{draft.minutes}分</span></div>
            <div className="flex justify-between"><span className="text-mute">日時</span><span>{fmtDay(draft.date)} {draft.time}〜{endTime(draft.time, draft.minutes)}</span></div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 rounded-[20px] border border-line bg-card p-4 text-sm">
          <div className="flex justify-between"><span className="text-mute">保有ポイント</span><span>{fmtPt(user.points)}</span></div>
          <div className="flex justify-between"><span className="text-mute">今回のご利用</span><span>-{fmtPt(draft.points)}</span></div>
          <div className="flex items-baseline justify-between border-t border-deep pt-2.5">
            <span className="text-mute">ご利用後の残り</span>
            <span className={`text-[22px] font-bold ${after < 0 ? "text-rose" : "text-gold"}`}>{after < 0 ? "不足" : fmtPt(after)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="note" className="text-[13px] text-lav">先生に事前に伝えたいこと(任意)</label>
          <textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="例:彼との今後について相談したいです" className="resize-none rounded-[14px] border border-edge bg-card px-3.5 py-3 text-sm leading-relaxed outline-none focus:border-gold" />
        </div>

        <div className="flex gap-2.5 rounded-2xl bg-[#1C2A3A] px-4 py-3.5">
          <IInfo className="mt-0.5 shrink-0 text-sky" />
          <div className="text-xs leading-[1.7] text-[#CFE3F5]">
            開始から最初の{settings.prepMinutes}分間は無料の準備時間です。予約の確定後、先生とのメッセージに入室ボタンが届きます。
          </div>
        </div>
        {error && <p className="text-xs text-rose">{error}</p>}
      </div>
    </Screen>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp, useGuard } from "@/lib/store";
import { add, fmtPt, list } from "@/lib/db";
import type { Booking } from "@/lib/types";
import { Loading, Screen, btnGold } from "@/components/ui";

const TAGS = ["寄り添ってくれた", "的確", "話しやすい", "前向きになれた", "テンポが良い", "また相談したい"];

export default function ReviewPage() {
  const ok = useGuard("user");
  const { bid } = useParams<{ bid: string }>();
  const router = useRouter();
  const { user, providers, saveProvider } = useApp();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [rate, setRate] = useState(5);
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    list<Booking>("bookings", { id: bid }).then((b) => setBooking(b[0] ?? null));
  }, [bid]);

  if (!ok || !user) return <Screen><Loading /></Screen>;
  const p = providers.find((x) => x.id === booking?.providerId);
  if (!booking || !p) return <Screen><Loading /></Screen>;

  async function submit() {
    if (!user || !p || !booking) return;
    setBusy(true);
    await add("reviews", { providerId: p.id, userId: user.id, userName: user.name, bookingId: booking.id, rating: rate, tags, text: text.trim() });
    const count = p.reviewCount + 1;
    const rating = Math.round(((p.rating * p.reviewCount + rate) / count) * 10) / 10;
    await saveProvider(p.id, { reviewCount: count, rating });
    router.replace("/home");
  }

  return (
    <Screen
      bottom={
        <div className="flex flex-col gap-1">
          <button onClick={submit} disabled={busy} className={`${btnGold} w-full`}>{busy ? "送信しています" : "送信してホームへ"}</button>
          <Link href={`/booking/${p.id}`} className="flex h-11 items-center justify-center text-sm text-gold">続けて次回を予約する</Link>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-2.5 px-5 pt-14">
        <img src={p.photo} alt="" className="h-[84px] w-[84px] rounded-full border-2 border-gold object-cover" />
        <div className="font-mincho text-[22px] font-bold">おつかれさまでした</div>
        <div className="text-center text-[13px] text-mute">
          {p.name} ・ {booking.method === "video" ? "ビデオ" : "音声"}通話 {booking.minutes}分 ・ {fmtPt(booking.points)}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-[18px] px-5 pb-6">
        <div className="flex flex-col items-center gap-2">
          <span className="text-[13px] text-lav">今日の鑑定はいかがでしたか?</span>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRate(n)} aria-label={`星${n}つ`} className="flex h-11 w-11 items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill={n <= rate ? "#D9A04A" : "none"} stroke="#D9A04A" strokeWidth={1.4} strokeLinejoin="round" aria-hidden>
                  <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-[13px] text-lav">よかったところ(複数選べます)</div>
          <div className="flex flex-wrap gap-1.5">
            {TAGS.map((t) => {
              const on = tags.includes(t);
              return (
                <button key={t} onClick={() => setTags(on ? tags.filter((x) => x !== t) : [...tags, t])} className={`h-9 rounded-full border px-3.5 text-[13px] ${on ? "border-gold bg-gold text-ink" : "border-edge text-soft"}`}>
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="rv" className="text-[13px] text-lav">感謝の声(任意・先生の詳細ページに公開されます)</label>
          <textarea id="rv" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="先生へのメッセージを書いてみましょう" className="resize-none rounded-[14px] border border-edge bg-card px-3.5 py-3 text-sm leading-relaxed outline-none focus:border-gold" />
        </div>
      </div>
    </Screen>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProviderMe } from "@/lib/useProviderMe";
import { fmtDay, fmtPt, list, ymd } from "@/lib/db";
import type { Booking, HistoryItem, Message } from "@/lib/types";
import { Loading, Screen } from "@/components/ui";

const STATES = [
  ["available", "待機中", "bg-mint", "border-mint"],
  ["busy", "鑑定中", "bg-gold", "border-gold"],
  ["off", "休止中", "bg-faint", "border-faint"],
] as const;

export default function ProviderHome() {
  const { ok, me, app } = useProviderMe();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hist, setHist] = useState<HistoryItem[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!me) return;
    const load = () => {
      list<Booking>("bookings", { providerId: me.id, status: "reserved" }).then((b) => setBookings(b.sort((a, c) => `${a.date}${a.time}`.localeCompare(`${c.date}${c.time}`))));
      list<HistoryItem>("history", { providerId: me.id }).then(setHist);
      list<Message>("messages", { providerId: me.id }).then((m) => {
        const last = new Map<string, Message>();
        m.filter((x) => x.from !== "system").forEach((x) => {
          const cur = last.get(x.threadId);
          if (!cur || cur.createdAt < x.createdAt) last.set(x.threadId, x);
        });
        setUnread(Array.from(last.values()).filter((x) => x.from === "user").length);
      });
    };
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [me]);

  if (!ok) return <Screen><Loading /></Screen>;
  if (!me) return <Screen><Loading label="占い師情報が見つかりません" /></Screen>;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const month = hist.filter((h) => h.createdAt >= monthStart);
  const share = app.settings.shareRate / 100;
  const earnings = Math.round(month.reduce((s, h) => s + Math.abs(h.points), 0) * share);
  const gifts = month.filter((h) => h.kind === "gift").reduce((s, h) => s + Math.abs(h.points), 0);
  const today = ymd(now);

  return (
    <Screen>
      <div className="flex h-[72px] items-center gap-3 px-4">
        <img src={me.photo} alt="" className="h-11 w-11 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold text-gold">占い師モード</div>
          <div className="truncate text-base font-bold">{me.name}</div>
        </div>
        <button
          onClick={() => {
            app.logout();
            router.replace("/login");
          }}
          className="text-xs text-mute"
        >
          ログアウト
        </button>
      </div>

      <div className="mx-4 rounded-[18px] border border-line bg-card p-3.5">
        <div className="mb-2.5 text-xs text-lav">いまの状態(お客様に表示されます)</div>
        <div className="grid grid-cols-3 gap-1.5">
          {STATES.map(([k, label, dot, border]) => {
            const on = me.status === k;
            return (
              <button key={k} onClick={() => app.saveProvider(me.id, { status: k })} className={`flex h-12 items-center justify-center gap-1.5 rounded-xl border text-sm font-bold ${on ? `${border} bg-deep text-text` : "border-line text-mute"}`}>
                <span className={`h-2 w-2 rounded-full ${dot}`} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-4 mt-3.5 grid grid-cols-2 gap-2">
        <Link href="/provider/earnings" className="rounded-2xl bg-card p-3.5 text-text">
          <div className="text-[11px] text-mute">今月の報酬見込み</div>
          <div className="mt-1 text-[22px] font-bold text-gold">{fmtPt(earnings)}</div>
        </Link>
        <Link href="/provider/earnings" className="rounded-2xl bg-card p-3.5 text-text">
          <div className="text-[11px] text-mute">いただいた感謝</div>
          <div className="mt-1 text-[22px] font-bold">{fmtPt(gifts)}</div>
        </Link>
      </div>

      <div className="mx-5 mb-2 mt-5 flex items-baseline justify-between">
        <span className="font-mincho text-base font-bold">これからの予約</span>
        <span className="text-xs text-mute">{bookings.length}件</span>
      </div>
      <div className="mx-4 flex flex-col gap-2">
        {bookings.length === 0 && <p className="rounded-2xl bg-card p-4 text-center text-xs text-mute">予約はまだありません</p>}
        {bookings.slice(0, 6).map((b, i) => (
          <div key={b.id} className={`flex items-center gap-3 rounded-2xl border bg-card px-3.5 py-3 ${i === 0 ? "border-gold" : "border-line"}`}>
            <div className="w-[60px] shrink-0 text-center">
              <div className="text-base font-bold">{b.time}</div>
              <div className="text-[10px] text-mute">{b.date === today ? "今日" : fmtDay(b.date).replace(/\(.\)/, "")} ・ {b.minutes}分</div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold">{b.userName} さん</div>
              <div className="truncate text-[11px] text-mute">{b.method === "video" ? "ビデオ" : "音声"}{b.note ? ` ・ ${b.note}` : ""}</div>
            </div>
            <Link href={`/provider/call/${b.id}`} className="flex h-10 shrink-0 items-center rounded-full bg-gold px-3.5 text-[13px] font-bold text-ink">入室</Link>
          </div>
        ))}
      </div>

      <div className="mx-4 mb-8 mt-3.5 overflow-hidden rounded-2xl border border-line bg-card">
        <Link href="/provider/messages" className="flex h-[50px] items-center gap-2.5 border-b border-deep px-4 text-sm text-text">
          <span className="flex-1">メッセージ</span>
          {unread > 0 && <span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-rose px-1.5 text-[11px] font-bold text-ink">{unread}</span>}
          <span className="text-faint">›</span>
        </Link>
        <Link href="/provider/schedule" className="flex h-[50px] items-center border-b border-deep px-4 text-sm text-text">
          <span className="flex-1">受付時間の設定</span>
          <span className="text-faint">›</span>
        </Link>
        <Link href="/provider/profile" className="flex h-[50px] items-center px-4 text-sm text-text">
          <span className="flex-1">プロフィール文・写真の編集</span>
          <span className="text-faint">›</span>
        </Link>
      </div>
    </Screen>
  );
}

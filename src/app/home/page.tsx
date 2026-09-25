"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp, useGuard } from "@/lib/store";
import { todaysFortune } from "@/lib/fortune";
import { fmtPt } from "@/lib/db";
import { IMic, IPalm, IStar, IVideo } from "@/components/icons";
import { Loading, Screen, StatusBadge } from "@/components/ui";

const TABS = [
  ["all", "総合"],
  ["love", "恋愛"],
  ["work", "仕事"],
  ["money", "金運"],
] as const;
const DOW = ["日", "月", "火", "水", "木", "金", "土"];

export default function Home() {
  const ok = useGuard("user");
  const { user, providers } = useApp();
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("all");
  if (!ok || !user) return <Screen nav="home"><Loading /></Screen>;

  const now = new Date();
  const hour = now.getHours();
  const greet = hour < 11 ? "おはようございます" : hour < 18 ? "こんにちは" : "こんばんは";
  const f = todaysFortune(user.id + user.birthday);
  const order = { available: 0, busy: 1, off: 2 };
  const shown = providers.filter((p) => p.visible !== false).sort((a, b) => order[a.status] - order[b.status]);

  return (
    <Screen nav="home">
      <div className="flex h-16 items-center justify-between px-5">
        <div className="flex items-center gap-2.5">
          <img src="/home-icon.png" alt="" className="h-9 w-9 object-contain" />
          <span className="font-mincho text-[21px] font-bold tracking-[0.12em] text-gold">杉の泉</span>
        </div>
        <Link href="/points" className="flex h-9 items-center gap-1.5 rounded-full border border-edge pl-3.5 pr-3 text-[13px] font-medium text-text">
          {fmtPt(user.points)}
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[15px] font-bold leading-none text-ink">+</span>
        </Link>
      </div>

      <div className="px-5 pb-3.5 pt-1">
        <div className="text-xs text-mute">
          {now.getMonth() + 1}月{now.getDate()}日({DOW[now.getDay()]})
        </div>
        <div className="mt-0.5 font-mincho text-[19px] font-semibold">
          {greet}、{user.name}さん
        </div>
      </div>

      <div className="mx-4 flex flex-col gap-3 rounded-[20px] border border-line bg-card p-[18px]">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-lav">今日のあなたの運勢</span>
          <span className="flex gap-[3px] text-gold">
            {[1, 2, 3, 4, 5].map((n) => (
              <IStar key={n} filled={n <= f.stars} className={n <= f.stars ? "" : "text-faint"} />
            ))}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {TABS.map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`h-[34px] rounded-full border text-[13px] font-medium ${tab === k ? "border-gold bg-gold text-ink" : "border-edge text-lav"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="min-h-[84px] font-mincho text-base leading-[1.75]">{f.texts[tab]}</p>
        <div className="flex gap-2">
          <div className="flex-1 rounded-[10px] bg-deep px-2.5 py-2">
            <div className="text-[11px] text-mute">ラッキーカラー</div>
            <div className="mt-0.5 text-[13px] font-medium">{f.color}</div>
          </div>
          <div className="flex-1 rounded-[10px] bg-deep px-2.5 py-2">
            <div className="text-[11px] text-mute">ラッキーアイテム</div>
            <div className="mt-0.5 text-[13px] font-medium">{f.item}</div>
          </div>
        </div>
        <Link href="/tellers" className="text-[13px] font-medium text-gold">この運勢を先生に詳しく聞く →</Link>
      </div>

      <div className="mx-4 mt-3.5 grid grid-cols-3 gap-2">
        {[
          ["/palm", "AI手相", <IPalm key="p" size={24} className="text-gold" />],
          ["/tellers", "今すぐ通話", <IVideo key="v" size={24} className="text-gold" />],
          ["/tellers", "声だけ相談", <IMic key="m" size={24} className="text-gold" />],
        ].map(([href, label, icon]) => (
          <Link key={label as string} href={href as string} className="flex h-[76px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-line bg-card text-text">
            {icon}
            <span className="text-xs font-medium">{label}</span>
          </Link>
        ))}
      </div>

      <div className="mx-5 mb-2.5 mt-5 flex items-baseline justify-between">
        <span className="font-mincho text-[17px] font-semibold">いま話せる先生</span>
        <Link href="/tellers" className="text-xs text-gold">すべて見る</Link>
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-6">
        {shown.map((p) => (
          <Link key={p.id} href={`/tellers/${p.id}`} className="w-[132px] shrink-0 text-text">
            <div className="relative h-[150px] w-[132px] overflow-hidden rounded-2xl bg-deep">
              <img src={p.photo} alt={p.name} className="h-full w-full object-cover" />
              <span className="absolute bottom-2 left-2">
                <StatusBadge status={p.status} />
              </span>
            </div>
            <div className="mt-2 truncate text-sm font-bold">{p.name}</div>
            <div className="truncate text-[11px] text-mute">
              {p.tag} ★{p.rating}
            </div>
          </Link>
        ))}
      </div>
    </Screen>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp, useGuard } from "@/lib/store";
import { list } from "@/lib/db";
import type { Message } from "@/lib/types";
import { Chip, Loading, Screen } from "@/components/ui";

function when(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export default function Messages() {
  const ok = useGuard("user");
  const { user, providers } = useApp();
  const [msgs, setMsgs] = useState<Message[] | null>(null);
  const [tab, setTab] = useState<"all" | "fav" | "notice">("all");

  useEffect(() => {
    if (!user) return;
    list<Message>("messages", { userId: user.id }).then(setMsgs);
  }, [user]);

  if (!ok || !user) return <Screen nav="messages"><Loading /></Screen>;

  const threads = new Map<string, Message>();
  (msgs ?? []).forEach((m) => {
    const cur = threads.get(m.providerId);
    if (!cur || cur.createdAt < m.createdAt) threads.set(m.providerId, m);
  });
  let rows = Array.from(threads.values()).sort((a, b) => b.createdAt - a.createdAt);
  if (tab === "fav") rows = rows.filter((m) => user.favorites?.includes(m.providerId));

  return (
    <Screen nav="messages">
      <div className="flex h-[60px] items-center px-5">
        <span className="font-mincho text-xl font-bold">メッセージ</span>
      </div>
      <div className="mx-4 grid grid-cols-3 gap-1.5">
        <Chip on={tab === "all"} onClick={() => setTab("all")}>あなた宛</Chip>
        <Chip on={tab === "fav"} onClick={() => setTab("fav")}>お気に入り</Chip>
        <Chip on={tab === "notice"} onClick={() => setTab("notice")}>お知らせ</Chip>
      </div>

      {tab === "notice" ? (
        <div className="mt-2.5">
          <div className="flex items-center gap-3 border-b border-[#231D42] px-4 py-3.5">
            <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-deep">
              <img src="/home-icon.png" alt="" className="h-[38px] w-[38px] object-contain" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-bold">杉の泉 運営</div>
              <div className="mt-1 text-[13px] text-mute">杉の泉へようこそ。はじめての方は会員登録特典のポイントで、気になる先生に相談してみてください。</div>
            </div>
          </div>
        </div>
      ) : msgs === null ? (
        <Loading />
      ) : rows.length === 0 ? (
        <p className="mt-16 text-center text-xs leading-relaxed text-mute">
          先生からのメッセージが届くと
          <br />
          ここに表示されます
        </p>
      ) : (
        <div className="mt-2.5">
          {rows.map((m) => {
            const p = providers.find((x) => x.id === m.providerId);
            return (
              <Link key={m.providerId} href={`/messages/${m.providerId}`} className="flex items-center gap-3 border-b border-[#231D42] px-4 py-3.5 text-text">
                <img src={p?.photo ?? "/home-icon.png"} alt="" className="h-[52px] w-[52px] shrink-0 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <span className="truncate text-[15px] font-bold">{p?.name ?? "先生"}</span>
                    <span className="shrink-0 text-[11px] text-mute">{when(m.createdAt)}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    {m.from === "system" && <span className="flex h-5 shrink-0 items-center rounded-full bg-gold px-2 text-[10px] font-bold text-ink">予約確定</span>}
                    <span className="truncate text-[13px] text-mute">{m.text}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Screen>
  );
}

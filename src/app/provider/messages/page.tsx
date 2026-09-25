"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useProviderMe } from "@/lib/useProviderMe";
import { list } from "@/lib/db";
import type { Message, User } from "@/lib/types";
import { BackHeader, Loading, Screen } from "@/components/ui";

export default function ProviderMessages() {
  const { ok, me } = useProviderMe();
  const [msgs, setMsgs] = useState<Message[] | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!me) return;
    list<Message>("messages", { providerId: me.id }).then(setMsgs);
    list<User>("users").then(setUsers);
  }, [me]);

  if (!ok || !me) return <Screen><Loading /></Screen>;
  const last = new Map<string, Message>();
  (msgs ?? []).forEach((m) => {
    const cur = last.get(m.userId);
    if (!cur || cur.createdAt < m.createdAt) last.set(m.userId, m);
  });
  const rows = Array.from(last.values()).sort((a, b) => b.createdAt - a.createdAt);

  return (
    <Screen>
      <BackHeader title="メッセージ" href="/provider" />
      {msgs === null ? (
        <Loading />
      ) : rows.length === 0 ? (
        <p className="py-16 text-center text-sm text-mute">まだメッセージはありません</p>
      ) : (
        rows.map((m) => {
          const u = users.find((x) => x.id === m.userId);
          const waiting = m.from === "user";
          return (
            <Link key={m.userId} href={`/provider/messages/${m.userId}`} className="flex items-center gap-3 border-b border-[#231D42] px-4 py-3.5 text-text">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-deep font-mincho text-lg font-bold text-lav">{(u?.name ?? "?").charAt(0)}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[15px] font-bold">{u?.name ?? "お客様"} さん</span>
                  {waiting && <span className="shrink-0 rounded-full bg-rose px-2 text-[10px] font-bold leading-5 text-ink">未返信</span>}
                </div>
                <div className="mt-1 truncate text-[13px] text-mute">{m.text}</div>
              </div>
            </Link>
          );
        })
      )}
    </Screen>
  );
}

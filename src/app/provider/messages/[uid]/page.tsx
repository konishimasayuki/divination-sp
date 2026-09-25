"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useProviderMe } from "@/lib/useProviderMe";
import { add, fmtPt, list, threadIdOf, zodiacOf } from "@/lib/db";
import type { Booking, Message, User } from "@/lib/types";
import { BackHeader, Loading, Screen } from "@/components/ui";

const PHRASES = ["ご相談ありがとうございます。", "カードで見てみますね。", "通話でじっくりお話ししませんか?"];

export default function ProviderThread() {
  const { ok, me } = useProviderMe();
  const { uid } = useParams<{ uid: string }>();
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [client, setClient] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const tid = me ? threadIdOf(uid, me.id) : "";

  const load = useCallback(async () => {
    if (!tid || !me) return;
    const [m, b] = await Promise.all([list<Message>("messages", { threadId: tid }), list<Booking>("bookings", { userId: uid, providerId: me.id })]);
    setMsgs(m.sort((a, c) => a.createdAt - c.createdAt));
    setBookings(b);
  }, [tid, uid, me]);

  useEffect(() => {
    list<User>("users", { id: uid }).then((u) => setClient(u[0] ?? null));
  }, [uid]);
  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs.length]);

  if (!ok || !me) return <Screen><Loading /></Screen>;

  async function send() {
    if (!me || !draft.trim()) return;
    setBusy(true);
    await add("messages", { threadId: tid, userId: uid, providerId: me.id, from: "provider", text: draft.trim() });
    setDraft("");
    await load();
    setBusy(false);
  }

  return (
    <Screen
      bottom={
        <div className="flex flex-col gap-2.5">
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
            {PHRASES.map((p) => (
              <button key={p} onClick={() => setDraft(draft + p)} className="h-8 shrink-0 rounded-full border border-edge px-3 text-xs text-lav">{p}</button>
            ))}
          </div>
          <label htmlFor="reply" className="sr-only">返信を入力</label>
          <textarea id="reply" rows={4} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="返信を入力" className="resize-none rounded-[14px] border border-edge bg-night px-3.5 py-3 text-sm leading-relaxed outline-none focus:border-gold" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-mute">先生からの返信はお客様のポイントを消費しません ・ {draft.length}文字</span>
            <button onClick={send} disabled={busy || !draft.trim()} className="flex h-11 items-center rounded-full bg-gold px-[22px] text-sm font-bold text-ink disabled:opacity-40">送信する</button>
          </div>
        </div>
      }
    >
      <div className="sticky top-0 z-10 border-b border-[#2E2754] bg-night">
        <BackHeader href="/provider/messages">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-deep font-mincho font-bold text-lav">{(client?.name ?? "?").charAt(0)}</span>
          <div className="ml-1.5 min-w-0">
            <div className="truncate text-[15px] font-bold">{client?.name ?? "お客様"} さん</div>
            <div className="text-[11px] text-mute">
              {client ? `${zodiacOf(client.birthday)} ・ ${client.bloodType === "?" ? "血液型不明" : `${client.bloodType}型`}` : ""}
            </div>
          </div>
        </BackHeader>
      </div>
      <div className="flex flex-col gap-3 p-4">
        {msgs.map((m) => {
          if (m.from === "system") {
            const b = bookings.find((x) => x.id === m.bookingId);
            return (
              <div key={m.id} className="rounded-[18px] border border-gold bg-card p-3.5">
                <div className="text-xs font-bold text-gold">予約が入りました</div>
                <div className="mt-1 text-[13px] text-soft">{m.text}</div>
                {b?.status === "reserved" && (
                  <Link href={`/provider/call/${b.id}`} className="mt-2.5 flex h-11 items-center justify-center rounded-xl bg-gold text-sm font-bold text-ink">入室する</Link>
                )}
              </div>
            );
          }
          const mine = m.from === "provider";
          return (
            <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <div className={`max-w-[80%] whitespace-pre-wrap px-3.5 py-2.5 text-sm leading-[1.7] ${mine ? "rounded-[18px_18px_4px_18px] bg-gold text-ink" : "rounded-[18px_18px_18px_4px] bg-deep"}`}>{m.text}</div>
              {!mine && m.cost ? <div className="mt-1 text-[10px] text-dim">お客様 {m.text.length}文字 ・ {fmtPt(m.cost)}</div> : null}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
    </Screen>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useApp, useGuard } from "@/lib/store";
import { add, fmtPt, list, threadIdOf, zodiacOf } from "@/lib/db";
import type { Booking, Message } from "@/lib/types";
import { ICalendar, ISend } from "@/components/icons";
import { BackHeader, Loading, Screen } from "@/components/ui";

function hm(ts: number) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function Thread() {
  const ok = useGuard("user");
  const { pid } = useParams<{ pid: string }>();
  const { user, providers, spend } = useApp();
  const p = providers.find((x) => x.id === pid);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);
  const tid = user ? threadIdOf(user.id, pid) : "";

  const load = useCallback(async () => {
    if (!tid) return;
    const [m, b] = await Promise.all([list<Message>("messages", { threadId: tid }), list<Booking>("bookings", { userId: tid.split("__")[0], providerId: pid })]);
    setMsgs(m.sort((a, b2) => a.createdAt - b2.createdAt));
    setBookings(b);
  }, [tid, pid]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs.length, typing]);

  if (!ok || !user) return <Screen><Loading /></Screen>;
  if (!p) return <Screen><Loading label="先生が見つかりません" /></Screen>;
  const cost = text.trim().length * p.chatRate;

  async function send() {
    if (!user || !p) return;
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    setError("");
    const paid = await spend(cost, { kind: "msg", providerId: p.id, label: `${p.name} ・ メッセージ`, detail: `${body.length}文字` });
    if (!paid) {
      setBusy(false);
      setError("ポイントが不足しています");
      return;
    }
    const sent = await add<Message>("messages", { threadId: tid, userId: user.id, providerId: p.id, from: "user", text: body, cost });
    setText("");
    const next = [...msgs, sent];
    setMsgs(next);
    setBusy(false);

    if (p.isAI) {
      setTyping(true);
      try {
        const res = await fetch("/api/ai-reply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            persona: { name: p.name, tag: p.tag, bio: p.bio },
            profile: { name: user.name, birthday: user.birthday, zodiac: zodiacOf(user.birthday), bloodType: user.bloodType },
            history: next.map((m) => ({ from: m.from, text: m.text })),
          }),
        });
        const data = await res.json();
        if (res.ok && data.reply) {
          await add("messages", { threadId: tid, userId: user.id, providerId: p.id, from: "provider", text: data.reply });
        } else {
          setError(data.error || "AIの返信に失敗しました");
        }
      } finally {
        setTyping(false);
        load();
      }
    }
  }

  return (
    <Screen
      bottom={
        <div className="flex flex-col gap-1.5">
          <div className="flex items-end gap-2">
            <label htmlFor="msg" className="sr-only">メッセージを入力</label>
            <textarea
              id="msg"
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="メッセージを入力"
              className="max-h-28 min-h-11 flex-1 resize-none rounded-[22px] border border-edge bg-night px-3.5 py-2.5 text-sm leading-relaxed outline-none focus:border-gold"
            />
            <button onClick={send} disabled={busy || !text.trim()} aria-label="送信" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold text-ink disabled:opacity-40">
              <ISend />
            </button>
          </div>
          <div className="pl-3.5 text-[11px] text-mute">
            {text.trim() ? `${text.trim().length}文字 ・ ${fmtPt(cost)}` : `送信時に1文字${p.chatRate}ptを消費します`}(保有 {fmtPt(user.points)})
          </div>
          {error && <div className="pl-3.5 text-[11px] text-rose">{error}</div>}
        </div>
      }
    >
      <div className="sticky top-0 z-10 border-b border-[#2E2754] bg-night">
        <BackHeader href="/messages">
          <img src={p.photo} alt="" className="h-9 w-9 rounded-full object-cover" />
          <div className="ml-1.5 min-w-0">
            <div className="truncate text-[15px] font-bold">{p.name}</div>
            <div className="text-[11px] text-mute">メッセージ {p.chatRate}pt / 1文字</div>
          </div>
        </BackHeader>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {msgs.length === 0 && (
          <div className="py-8 text-center text-xs leading-relaxed text-mute">
            {p.name}に相談してみましょう。
            <br />
            <Link href={`/booking/${p.id}`} className="text-gold">通話の予約はこちら</Link>
          </div>
        )}
        {msgs.map((m) => {
          if (m.from === "system") {
            const b = bookings.find((x) => x.id === m.bookingId);
            return (
              <div key={m.id} className="flex flex-col gap-2.5 rounded-[18px] border border-gold bg-card p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-gold">
                  <ICalendar />
                  ご予約が確定しました
                </div>
                <div className="text-[13px] leading-relaxed text-soft">{m.text}</div>
                {b && b.status === "reserved" ? (
                  <>
                    <Link href={`/call/${b.id}`} className="flex h-12 items-center justify-center rounded-xl bg-gold text-[15px] font-bold text-ink">
                      入室する
                    </Link>
                    <div className="text-center text-[11px] text-mute">時間になったらこちらから入室してください</div>
                  </>
                ) : (
                  <div className="text-center text-xs text-mute">{b?.status === "done" ? "この鑑定は終了しました" : ""}</div>
                )}
              </div>
            );
          }
          const mine = m.from === "user";
          return (
            <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <div className={`max-w-[80%] whitespace-pre-wrap px-3.5 py-2.5 text-sm leading-[1.7] ${mine ? "rounded-[18px_18px_4px_18px] bg-gold text-ink" : "rounded-[18px_18px_18px_4px] bg-deep"}`}>
                {m.text}
              </div>
              <div className="mt-1 text-[10px] text-dim">
                {hm(m.createdAt)}
                {mine && m.cost ? ` ・ ${fmtPt(m.cost)}` : ""}
              </div>
            </div>
          );
        })}
        {typing && <div className="self-start rounded-[18px] bg-deep px-3.5 py-2.5 text-sm text-mute">{p.name}が入力中…</div>}
        <div ref={endRef} />
      </div>
    </Screen>
  );
}

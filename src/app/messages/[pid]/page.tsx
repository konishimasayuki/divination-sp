"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useApp, useGuard } from "@/lib/store";
import { add, fmtPt, list, threadIdOf, update, zodiacOf } from "@/lib/db";
import type { Booking, Message } from "@/lib/types";
import { ICalendar, ISend } from "@/components/icons";
import { AttachButton, AttachmentList, PendingFiles } from "@/components/Attachments";
import { uploadAttachment } from "@/lib/attach";
import { callWindow } from "@/lib/callWindow";
import { canRetract, retractMessage, retractedLabel } from "@/lib/retract";
import { BackHeader, Loading, Screen } from "@/components/ui";

function hm(ts: number) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function Thread() {
  const ok = useGuard("user");
  const { pid } = useParams<{ pid: string }>();
  const { user, providers, spend, settings } = useApp();
  const p = providers.find((x) => x.id === pid);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState("");
  const [opening, setOpening] = useState<string | null>(null);
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
  const replyRate = p.replyRate ?? 500;

  // 先生の返信を開封する(ここでポイントを消費)
  async function unlock(m: Message) {
    if (!user || !p) return;
    const price = m.price ?? 0;
    setOpening(m.id);
    setError("");
    // 支払う前に、取り消されていないか確認
    const latest = (await list<Message>("messages", { id: m.id }))[0];
    if (!latest || latest.retracted) {
      setOpening(null);
      setError("このメッセージは送信が取り消されました");
      await load();
      return;
    }
    const paid = await spend(price, { kind: "msg", providerId: p.id, rate: p.shareRate != null ? p.shareRate : settings.shareRate, label: `${p.name} ・ メッセージ`, detail: "返信を開封" });
    if (!paid) {
      setOpening(null);
      setError("ポイントが不足しています");
      return;
    }
    await update("messages", m.id, { unlocked: true, unlockedAt: Date.now() });
    await load();
    setOpening(null);
  }

  async function retract(m: Message) {
    if (!window.confirm("このメッセージの送信を取り消しますか?(相手の画面からも消えます)")) return;
    setError("");
    try {
      await retractMessage(m.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "取り消せませんでした");
    }
    await load();
  }

  async function send() {
    if (!user || !p) return;
    const body = text.trim();
    if (!body && !files.length) return;
    setBusy(true);
    setError("");
    let attachments;
    try {
      attachments = files.length ? await Promise.all(files.map((f) => uploadAttachment(f, tid))) : undefined;
    } catch (e) {
      setError(e instanceof Error ? e.message : "添付ファイルを送れませんでした");
      setBusy(false);
      return;
    }
    const sent = await add<Message>("messages", { threadId: tid, userId: user.id, providerId: p.id, from: "user", text: body, ...(attachments ? { attachments } : {}) });
    setText("");
    setFiles([]);
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
            threadId: tid,
            persona: { name: p.name, tag: p.tag, bio: p.bio },
            profile: { name: user.name, birthday: user.birthday, zodiac: zodiacOf(user.birthday), bloodType: user.bloodType },
            history: next.map((m) => ({ from: m.from, text: m.text || (m.attachments?.length ? "(写真やファイルを送りました)" : "") })),
          }),
        });
        const data = await res.json();
        if (res.ok && data.reply) {
          await add("messages", { threadId: tid, userId: user.id, providerId: p.id, from: "provider", text: data.reply, price: replyRate });
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
          <PendingFiles files={files} onRemove={(i) => setFiles(files.filter((_, j) => j !== i))} />
          <div className="flex items-end gap-2">
            <AttachButton disabled={busy} onPick={(f) => setFiles([...files, ...f].slice(0, 10))} />
            <label htmlFor="msg" className="sr-only">メッセージを入力</label>
            <textarea
              id="msg"
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="メッセージを入力"
              className="max-h-28 min-h-11 flex-1 resize-none rounded-[22px] border border-edge bg-night px-3.5 py-2.5 text-sm leading-relaxed outline-none focus:border-gold"
            />
            <button onClick={send} disabled={busy || (!text.trim() && !files.length)} aria-label="送信" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold text-ink disabled:opacity-40">
              <ISend />
            </button>
          </div>
          <div className="pl-3.5 text-[11px] text-mute">
            {busy && files.length ? "添付ファイルを送っています…" : <>送信は無料です。有料の返信は1通{fmtPt(replyRate)}で開封できます(保有 {fmtPt(user.points)})</>}
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
            <div className="text-[11px] text-mute">送信無料 ・ 有料の返信は {fmtPt(replyRate)} / 1通</div>
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
                {b && b.status === "reserved" && !callWindow(b, settings.prepMinutes).expired ? (
                  <>
                    <Link href={`/call/${b.id}`} className="flex h-12 items-center justify-center rounded-xl bg-gold text-[15px] font-bold text-ink">
                      {callWindow(b, settings.prepMinutes).started ? `鑑定に戻る(残り約${callWindow(b, settings.prepMinutes).leftMin}分)` : "入室する"}
                    </Link>
                    <div className="text-center text-[11px] text-mute">
                      {callWindow(b, settings.prepMinutes).started ? "通話が途切れても、時間内ならここから戻れます" : "時間になったらこちらから入室してください"}
                    </div>
                  </>
                ) : b && b.status === "reserved" ? (
                  <div className="text-center text-xs text-mute">鑑定時間が終了しました</div>
                ) : (
                  <div className="text-center text-xs text-mute">{b?.status === "done" ? "この鑑定は終了しました" : ""}</div>
                )}
              </div>
            );
          }
          const mine = m.from === "user";
          if (m.retracted) {
            return (
              <div key={m.id} className="self-center rounded-full bg-card px-3.5 py-1.5 text-[11px] text-mute">
                {retractedLabel(mine, p.name)}
              </div>
            );
          }
          const locked = !mine && (m.price ?? 0) > 0 && !m.unlocked;
          if (locked) {
            return (
              <div key={m.id} className="flex flex-col items-start">
                <div className="w-[80%] overflow-hidden rounded-[18px_18px_18px_4px] border border-gold bg-card">
                  <div className="px-4 pb-2 pt-3.5">
                    <div className="text-xs font-bold text-gold">{p.name}から返信が届きました</div>
                    <div className="mt-2 flex flex-col gap-1.5" aria-hidden>
                      <span className="h-2.5 w-full rounded bg-deep" />
                      <span className="h-2.5 w-11/12 rounded bg-deep" />
                      <span className="h-2.5 w-3/5 rounded bg-deep" />
                    </div>
                  </div>
                  <button onClick={() => unlock(m)} disabled={opening === m.id} className="flex h-11 w-full items-center justify-center bg-gold text-sm font-bold text-ink disabled:opacity-50">
                    {opening === m.id ? "開いています" : `${fmtPt(m.price ?? 0)} で返信を読む`}
                  </button>
                </div>
                <div className="mt-1 text-[10px] text-dim">{hm(m.createdAt)}</div>
              </div>
            );
          }
          return (
            <div key={m.id} className={`flex flex-col gap-1.5 ${mine ? "items-end" : "items-start"}`}>
              {m.text && (
                <div className={`max-w-[80%] whitespace-pre-wrap px-3.5 py-2.5 text-sm leading-[1.7] ${mine ? "rounded-[18px_18px_4px_18px] bg-gold text-ink" : "rounded-[18px_18px_18px_4px] bg-deep"}`}>
                  {m.text}
                </div>
              )}
              {m.attachments?.length ? <AttachmentList items={m.attachments} mine={mine} /> : null}
              <div className="mt-1 text-[10px] text-dim">
                {hm(m.createdAt)}
                {!mine && m.unlocked && m.price ? ` ・ ${fmtPt(m.price)}で開封` : ""}
                {mine && canRetract(m) && (
                  <button onClick={() => retract(m)} className="ml-2 text-lav underline underline-offset-2">取り消す</button>
                )}
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

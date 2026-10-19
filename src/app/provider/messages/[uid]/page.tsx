"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useProviderMe } from "@/lib/useProviderMe";
import { add, fmtPt, list, threadIdOf, zodiacOf } from "@/lib/db";
import type { Booking, Message, User } from "@/lib/types";
import { BackHeader, Loading, Screen } from "@/components/ui";
import { AttachButton, AttachmentList, PendingFiles } from "@/components/Attachments";
import { uploadAttachment } from "@/lib/attach";
import { callWindow } from "@/lib/callWindow";
import { canRetract, retractMessage, retractedLabel } from "@/lib/retract";

const PHRASES = ["ご相談ありがとうございます。", "カードで見てみますね。", "通話でじっくりお話ししませんか?", "ご都合のよい日時を教えてください。"];

export default function ProviderThread() {
  const { ok, me, app } = useProviderMe();
  const { uid } = useParams<{ uid: string }>();
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [client, setClient] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [paid, setPaid] = useState(true); // このメッセージを有料(開封にポイント)にするか
  const [amount, setAmount] = useState<string | null>(null); // このメッセージの料金(未入力ならプロフィールの標準料金)
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);
  const tid = me ? threadIdOf(uid, me.id) : "";

  const load = useCallback(async () => {
    if (!tid || !me) return;
    const [m, b] = await Promise.all([list<Message>("messages", { threadId: tid, _raw: "1" }), list<Booking>("bookings", { userId: uid, providerId: me.id })]);
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

  const baseRate = me.replyRate ?? 500;
  const rate = amount === null ? baseRate : Math.min(100000, Number(amount) || 0);
  const PRESETS = Array.from(new Set([300, 500, 1000, 2000, 3000, baseRate])).sort((a, b) => a - b);

  // 送信取り消し。edit=true なら本文を入力欄に戻して、料金を選び直して送れるようにする
  async function retract(m: Message, edit: boolean) {
    const q = edit ? "送信を取り消して、入力欄に戻しますか?(料金や本文を直して送り直せます)" : "このメッセージの送信を取り消しますか?(お客様の画面からも消えます)";
    if (!window.confirm(q)) return;
    setError("");
    try {
      await retractMessage(m.id);
      if (edit) {
        setDraft(m.text);
        setPaid((m.price ?? 0) > 0);
        if ((m.price ?? 0) > 0) setAmount(String(m.price));
        if (m.attachments?.length) setError("添付ファイルは戻せないため、もう一度選んでください");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "取り消せませんでした");
    }
    await load();
  }

  async function send() {
    if (!me || (!draft.trim() && !files.length)) return;
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
    await add("messages", {
      threadId: tid,
      userId: uid,
      providerId: me.id,
      from: "provider",
      text: draft.trim(),
      price: paid && rate > 0 ? rate : 0,
      ...(attachments ? { attachments } : {}),
    });
    setDraft("");
    setFiles([]);
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
          <div role="radiogroup" aria-label="このメッセージの料金" className="grid grid-cols-2 gap-1 rounded-full border border-edge bg-night p-1">
            <button role="radio" aria-checked={paid} onClick={() => setPaid(true)} className={`h-9 rounded-full text-[13px] font-bold ${paid ? "bg-gold text-ink" : "text-mute"}`}>
              有料 {rate > 0 ? fmtPt(rate) : ""}
            </button>
            <button role="radio" aria-checked={!paid} onClick={() => setPaid(false)} className={`h-9 rounded-full text-[13px] font-bold ${!paid ? "bg-mint text-ink" : "text-mute"}`}>
              無料(連絡用)
            </button>
          </div>
          {paid && (
            <div className="flex flex-col gap-1.5">
              <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
                {PRESETS.map((v) => (
                  <button key={v} onClick={() => setAmount(String(v))} className={`h-8 shrink-0 rounded-full border px-3 text-xs font-bold ${rate === v ? "border-gold bg-gold text-ink" : "border-edge text-lav"}`}>
                    {v.toLocaleString()}pt
                  </button>
                ))}
                <label className="flex h-8 shrink-0 items-center gap-1 rounded-full border border-edge pl-3 pr-2 text-xs text-lav">
                  金額
                  <input
                    inputMode="numeric"
                    aria-label="このメッセージの料金(pt)"
                    value={amount ?? String(baseRate)}
                    onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
                    className="w-16 bg-transparent text-right font-bold text-text outline-none"
                  />
                  pt
                </label>
              </div>
              {rate === 0 && <span className="text-[11px] text-rose">金額を入れてください(0ptなら「無料」を選んでください)</span>}
            </div>
          )}
          <PendingFiles files={files} onRemove={(i) => setFiles(files.filter((_, j) => j !== i))} />
          <label htmlFor="reply" className="sr-only">返信を入力</label>
          <textarea id="reply" rows={4} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="返信を入力" className="resize-none rounded-[14px] border border-edge bg-night px-3.5 py-3 text-sm leading-relaxed outline-none focus:border-gold" />
          <div className="flex items-center justify-between gap-2.5">
            <AttachButton disabled={busy} onPick={(f) => setFiles([...files, ...f].slice(0, 10))} />
            <span className="min-w-0 flex-1 text-[11px] leading-snug text-mute">
              {busy && files.length ? "添付ファイルを送っています…" : paid ? `お客様は ${fmtPt(rate)} で開封します` : "お客様はそのまま読めます(料金なし)"}
            </span>
            <button onClick={send} disabled={busy || (!draft.trim() && !files.length) || (paid && rate === 0)} className="flex h-11 shrink-0 items-center whitespace-nowrap rounded-full bg-gold px-[22px] text-sm font-bold text-ink disabled:opacity-40">送信する</button>
          </div>
          {error && <div className="text-[11px] text-rose">{error}</div>}
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
                {b?.status === "reserved" && !callWindow(b, app.settings.prepMinutes).expired && (
                  <Link href={`/provider/call/${b.id}`} className="mt-2.5 flex h-11 items-center justify-center rounded-xl bg-gold text-sm font-bold text-ink">
                    {callWindow(b, app.settings.prepMinutes).started ? `鑑定に戻る(残り約${callWindow(b, app.settings.prepMinutes).leftMin}分)` : "入室する"}
                  </Link>
                )}
                {b?.status === "reserved" && callWindow(b, app.settings.prepMinutes).expired && <div className="mt-2 text-center text-xs text-mute">鑑定時間が終了しました</div>}
              </div>
            );
          }
          const mine = m.from === "provider";
          if (m.retracted) {
            return (
              <div key={m.id} className="self-center rounded-full bg-card px-3.5 py-1.5 text-[11px] text-mute">
                {retractedLabel(mine, `${client?.name ?? "お客様"}さん`)}
              </div>
            );
          }
          return (
            <div key={m.id} className={`flex flex-col gap-1.5 ${mine ? "items-end" : "items-start"}`}>
              {m.text && <div className={`max-w-[80%] whitespace-pre-wrap px-3.5 py-2.5 text-sm leading-[1.7] ${mine ? "rounded-[18px_18px_4px_18px] bg-gold text-ink" : "rounded-[18px_18px_18px_4px] bg-deep"}`}>{m.text}</div>}
              {m.attachments?.length ? <AttachmentList items={m.attachments} mine={mine} /> : null}
              {mine && (m.price ?? 0) > 0 ? (
                <div className={`text-[10px] ${m.unlocked ? "text-mint-hi" : "text-dim"}`}>{m.unlocked ? `お客様が開封済み ・ ${fmtPt(m.price ?? 0)}` : `未開封 ・ 開封で ${fmtPt(m.price ?? 0)}`}</div>
              ) : mine ? (
                <div className="text-[10px] text-dim">無料で送信</div>
              ) : null}
              {mine && canRetract(m) && (
                <div className="flex gap-3 text-[11px]">
                  <button onClick={() => retract(m, true)} className="text-gold underline underline-offset-2">
                    取り消して修正する
                  </button>
                  <button onClick={() => retract(m, false)} className="text-lav underline underline-offset-2">取り消す</button>
                </div>
              )}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
    </Screen>
  );
}

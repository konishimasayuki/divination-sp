"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProviderMe } from "@/lib/useProviderMe";
import { fmtBirth, list, update, zodiacOf } from "@/lib/db";
import type { Booking, User } from "@/lib/types";
import { useAgoraCall, useCountdown } from "@/lib/useAgoraCall";
import { IEnd, IMic, IMicOff, ISwitch, IVideo } from "@/components/icons";
import { Loading } from "@/components/ui";

function Ctrl({ label, onClick, tone = "base", children }: { label: string; onClick: () => void; tone?: "base" | "gold" | "red" | "off"; children: React.ReactNode }) {
  const bg = { base: "bg-deep text-text", gold: "bg-gold text-ink", red: "bg-danger text-white", off: "bg-[#3A1C24] text-rose" }[tone];
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 text-[11px] text-text">
      <span className={`flex h-[52px] w-[52px] items-center justify-center rounded-full ${bg}`}>{children}</span>
      {label}
    </button>
  );
}

export default function ProviderCall() {
  const { ok, me, app } = useProviderMe();
  const { bid } = useParams<{ bid: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [client, setClient] = useState<User | null>(null);
  const [visits, setVisits] = useState(0);
  const [memo, setMemo] = useState("");
  const [prevMemo, setPrevMemo] = useState("");
  const [saved, setSaved] = useState(false);
  const [camNote, setCamNote] = useState("");

  useEffect(() => {
    list<Booking>("bookings", { id: bid }).then(async (b) => {
      const bk = b[0];
      if (!bk) return;
      setBooking(bk);
      setMemo(bk.memo ?? "");
      const [u, all] = await Promise.all([list<User>("users", { id: bk.userId }), list<Booking>("bookings", { userId: bk.userId, providerId: bk.providerId })]);
      setClient(u[0] ?? null);
      setVisits(all.length);
      const prev = all.filter((x) => x.id !== bk.id && x.memo).sort((a, c) => c.createdAt - a.createdAt)[0];
      setPrevMemo(prev?.memo ?? "");
    });
  }, [bid]);

  const audioOnly = booking?.method === "voice";
  const call = useAgoraCall({ channel: booking?.channel ?? "", uid: 2, audioOnly, enabled: !!booking && booking.status === "reserved" });
  const timer = useCountdown(call.remoteJoined ? call.connectedAt : null, (booking?.minutes ?? 0) * 60 + app.settings.prepMinutes * 60);

  if (!ok || !me) return <Loading />;
  if (!booking) return <div className="h-[100dvh] bg-abyss"><Loading label="予約を読み込んでいます" /></div>;

  async function saveMemo() {
    if (!booking) return;
    await update("bookings", booking.id, { memo });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function end() {
    if (!booking || !me) return;
    await update("bookings", booking.id, { status: "done", memo });
    await app.saveProvider(me.id, { status: "available" });
    router.replace("/provider");
  }

  const name = booking.userName;
  const statusText = call.status === "error" ? call.error : call.status !== "connected" ? "接続しています…" : !call.remoteJoined ? `${name}さんの入室を待っています` : !call.remoteHasVideo ? `${name}さん ・ カメラOFF(顔出しなし)` : "";

  return (
    <div className="flex h-[100dvh] justify-center bg-abyss">
      <div className="relative flex h-full w-full max-w-[430px] flex-col overflow-hidden">
        <div className="relative h-[46%] shrink-0 bg-[#16112B]">
          <div ref={call.remoteRef} className="absolute inset-0" />
          {statusText && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
              <span className="flex h-24 w-24 items-center justify-center rounded-full bg-deep font-mincho text-4xl font-bold text-lav">{name.charAt(0)}</span>
              <span className="px-6 text-center text-[13px] text-mute">{statusText}</span>
            </div>
          )}
          <div className="absolute left-4 right-4 flex items-center justify-between" style={{ top: "calc(env(safe-area-inset-top) + 12px)" }}>
            <span className="flex h-[30px] items-center gap-1.5 rounded-full bg-night px-3 text-xs">
              <span className={`h-[7px] w-[7px] rounded-full ${call.remoteJoined ? "bg-rose" : "bg-faint"}`} />
              {call.remoteJoined ? `鑑定中 ${timer.elapsedText}` : "待機中"}
            </span>
            <span className="flex h-[30px] items-center rounded-full bg-night px-3 text-xs font-bold text-gold">残り {timer.leftText}</span>
          </div>
          {!audioOnly && (
            <div className="absolute right-4 h-[120px] w-[92px] overflow-hidden rounded-[14px] border-2 border-night bg-deep" style={{ top: "calc(env(safe-area-inset-top) + 56px)" }}>
              <div ref={call.localRef} className="h-full w-full" />
              <span className="absolute bottom-1.5 left-1.5 rounded-md bg-night px-1.5 py-0.5 text-[10px]">あなた</span>
            </div>
          )}
        </div>

        <div className="relative -mt-5 flex flex-1 flex-col gap-3 overflow-y-auto rounded-t-3xl bg-night px-4 pb-4 pt-[18px]">
          <div className="flex items-center justify-between">
            <span className="font-mincho text-base font-bold">お客様カルテ</span>
            <span className="text-[11px] text-mute">鑑定 {visits}回目</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              ["生年月日", client ? fmtBirth(client.birthday).slice(2) : "-"],
              ["星座", client ? zodiacOf(client.birthday) : "-"],
              ["血液型", client ? (client.bloodType === "?" ? "不明" : `${client.bloodType}型`) : "-"],
              ["性別", client?.gender ?? "-"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-[10px] bg-card py-2 text-center">
                <div className="text-[10px] text-mute">{k}</div>
                <div className="mt-0.5 text-xs font-bold">{v}</div>
              </div>
            ))}
          </div>
          {client?.birthTime && <div className="text-[11px] text-mute">出生時間 {client.birthTime}</div>}
          <div className="rounded-xl bg-card p-3">
            <div className="text-[11px] font-bold text-gold">事前の相談内容</div>
            <div className="mt-1 text-[13px] leading-[1.7]">{booking.note || "(記入なし)"}</div>
          </div>
          {prevMemo && (
            <div className="rounded-xl bg-card p-3">
              <div className="text-[11px] font-bold text-mute">前回のメモ</div>
              <div className="mt-1 whitespace-pre-wrap text-[13px] leading-[1.7] text-soft">{prevMemo}</div>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="memo" className="text-[11px] font-bold text-mute">先生用メモ(お客様には見えません)</label>
            <textarea id="memo" rows={3} value={memo} onChange={(e) => setMemo(e.target.value)} onBlur={saveMemo} placeholder="鑑定内容や次回への引き継ぎを残せます" className="resize-none rounded-xl border border-edge bg-card px-3 py-2.5 text-[13px] leading-relaxed outline-none focus:border-gold" />
            {saved && <span className="text-[11px] text-mint-hi">保存しました</span>}
          </div>
          {camNote && <div className="text-center text-[11px] text-mute">{camNote}</div>}
        </div>

        <div className="grid shrink-0 grid-cols-4 bg-night px-4 pt-2" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)" }}>
          <Ctrl label="マイク" onClick={call.toggleMic} tone={call.micOn ? "base" : "off"}>{call.micOn ? <IMic /> : <IMicOff />}</Ctrl>
          <Ctrl label="カメラ" onClick={call.toggleCam} tone={audioOnly ? "off" : call.camOn ? "base" : "off"}><IVideo /></Ctrl>
          <Ctrl
            label="顔 / 手元"
            tone="gold"
            onClick={async () => {
              const ok2 = await call.switchCamera();
              setCamNote(ok2 ? "カメラを切り替えました" : "切り替えられるカメラが見つかりません");
              setTimeout(() => setCamNote(""), 2500);
            }}
          >
            <ISwitch />
          </Ctrl>
          <Ctrl label="終了" onClick={end} tone="red"><IEnd /></Ctrl>
        </div>
      </div>
    </div>
  );
}

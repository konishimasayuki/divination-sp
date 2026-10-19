"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp, useGuard } from "@/lib/store";
import { list, update } from "@/lib/db";
import { callWindow } from "@/lib/callWindow";
import type { Booking } from "@/lib/types";
import { useAgoraCall, useCountdown } from "@/lib/useAgoraCall";
import { GiftSheet } from "@/components/GiftSheet";
import { IEnd, IGift, IMic, IMicOff, IPip, ISpeaker, IUser, IVideo } from "@/components/icons";
import { Loading } from "@/components/ui";

function CtrlButton({ label, onClick, children, tone = "base" }: { label: string; onClick: () => void; children: React.ReactNode; tone?: "base" | "gold" | "red" | "off" }) {
  const bg = { base: "bg-deep text-text", gold: "bg-gold text-ink", red: "bg-danger text-white", off: "bg-[#3A1C24] text-rose" }[tone];
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 text-[11px] text-text">
      <span className={`flex h-[52px] w-[52px] items-center justify-center rounded-full ${bg}`}>{children}</span>
      {label}
    </button>
  );
}

export default function CallPage() {
  const ok = useGuard("user");
  const { bid } = useParams<{ bid: string }>();
  const router = useRouter();
  const { providers, settings } = useApp();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [gift, setGift] = useState(false);
  const [toast, setToast] = useState("");
  const p = providers.find((x) => x.id === booking?.providerId);
  const audioOnly = booking?.method === "voice";

  const [expiredAtLoad, setExpiredAtLoad] = useState(false);

  useEffect(() => {
    list<Booking>("bookings", { id: bid }).then((b) => {
      const bk = b[0] ?? null;
      setBooking(bk);
      // 時間を過ぎてから開いた場合は終了扱い
      if (bk && bk.status === "reserved" && callWindow(bk, settings.prepMinutes).expired) {
        setExpiredAtLoad(true);
        update("bookings", bk.id, { status: "done" });
      }
    });
  }, [bid, settings.prepMinutes]);

  const call = useAgoraCall({ channel: booking?.channel ?? "", uid: 1, audioOnly, enabled: !!booking && booking.status === "reserved" && !expiredAtLoad });

  // 双方が初めてつながった時刻を予約に記録(途切れて入り直しても、この時刻から時間を数える)
  useEffect(() => {
    if (!call.remoteJoined || !booking || booking.startedAt) return;
    list<Booking>("bookings", { id: booking.id }).then(async (b) => {
      const startedAt = b[0]?.startedAt ?? Date.now();
      if (!b[0]?.startedAt) await update("bookings", booking.id, { startedAt });
      setBooking((cur) => (cur ? { ...cur, startedAt } : cur));
    });
  }, [call.remoteJoined, booking]);

  const timer = useCountdown(booking?.startedAt ?? null, (booking?.minutes ?? 0) * 60 + settings.prepMinutes * 60);
  const started = !!booking?.startedAt;
  const inPrep = started && timer.elapsed < settings.prepMinutes * 60;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  async function end() {
    if (timer.left > 0 && !window.confirm("終了すると、時間が残っていても再入室できません。鑑定を終了しますか?")) return;
    if (booking) await update("bookings", booking.id, { status: "done" });
    router.replace(`/review/${bid}`);
  }

  if (!ok) return <Loading />;
  if (!booking || !p) return <div className="h-[100dvh] bg-abyss"><Loading label="予約を読み込んでいます" /></div>;
  if (booking.status !== "reserved" || expiredAtLoad) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-4 bg-abyss px-8 text-center">
        <p className="text-sm text-lav">{expiredAtLoad ? "鑑定時間が終了しました" : "この鑑定はすでに終了しています"}</p>
        <button onClick={() => router.replace(`/messages/${booking.providerId}`)} className="text-gold">メッセージに戻る</button>
      </div>
    );
  }

  const statusText =
    call.status === "error"
      ? call.error
      : call.status !== "connected"
        ? started ? "鑑定に戻っています…" : "接続しています…"
        : !call.remoteJoined
          ? started ? `${p.name}の接続が切れました。戻ってくるまでお待ちください` : `${p.name}の入室を待っています`
          : "";

  return (
    <div className="flex h-[100dvh] justify-center bg-abyss">
      <div className="relative h-full w-full max-w-[430px] overflow-hidden bg-abyss">
        {/* 相手の映像(音声通話時は写真) */}
        {audioOnly ? (
          <div className="flex h-full flex-col items-center pt-[22%]">
            <div className="flex h-[232px] w-[232px] items-center justify-center rounded-full border border-deep">
              <div className="flex h-[196px] w-[196px] items-center justify-center rounded-full border border-edge">
                <img src={p.photo} alt={p.name} className="h-[156px] w-[156px] rounded-full border-2 border-gold object-cover" />
              </div>
            </div>
            <div className="mt-6 font-mincho text-[26px] font-bold">{p.name}</div>
            <div className="mt-1.5 text-[15px] text-lav">{statusText || `通話中 ${timer.elapsedText}`}</div>
            <div ref={call.remoteRef} className="hidden" />
          </div>
        ) : (
          <>
            <div ref={call.remoteRef} className="absolute inset-0 bg-[#16112B]" />
            {!call.remoteHasVideo && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <img src={p.photo} alt="" className="h-28 w-28 rounded-full object-cover opacity-80" />
                <span className="px-8 text-center text-sm text-lav">{statusText || `${p.name}のカメラはオフです`}</span>
              </div>
            )}
          </>
        )}

        {/* 上部の情報 */}
        <div className="absolute left-4 right-4 flex items-center justify-between rounded-2xl bg-[rgba(20,16,42,0.82)] px-3.5 py-3" style={{ top: "calc(env(safe-area-inset-top) + 12px)" }}>
          <div>
            <div className="font-mincho text-base font-bold">{p.name}</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-lav">
              <span className={`h-[7px] w-[7px] rounded-full ${call.remoteJoined ? "bg-rose" : "bg-faint"}`} />
              {call.remoteJoined ? (inPrep ? `準備時間(無料) ${timer.elapsedText}` : `通話中 ${timer.elapsedText}`) : started ? "再接続待ち" : "待機中"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-lav">残り</div>
            <div className={`text-base font-bold ${timer.left < 120 && started ? "text-rose" : "text-gold"}`}>{timer.leftText}</div>
          </div>
        </div>

        {/* 自分の映像(ワイプ) */}
        {!audioOnly && (
          <div className="absolute right-4 h-32 w-24 overflow-hidden rounded-[14px] border-2 border-night bg-deep" style={{ top: "calc(env(safe-area-inset-top) + 96px)" }}>
            <div ref={call.localRef} className="h-full w-full" />
            {!call.camOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-deep text-lav">
                <IUser size={26} />
                <span className="text-[10px]">カメラOFF</span>
              </div>
            )}
          </div>
        )}

        {toast && (
          <div className="absolute left-4 rounded-[14px] bg-gold px-3 py-2 text-[13px] font-bold text-ink" style={{ bottom: "calc(env(safe-area-inset-bottom) + 150px)" }}>
            {toast}
          </div>
        )}
        {call.status === "error" && timer.left > 0 && (
          <div className="absolute inset-x-6 top-1/2 flex -translate-y-1/2 flex-col items-center gap-3 rounded-2xl border border-line bg-night/95 p-5 text-center">
            <p className="text-sm leading-relaxed text-lav">{call.error || "通話に接続できませんでした"}</p>
            <button onClick={call.reconnect} className="flex h-12 w-full items-center justify-center rounded-xl bg-gold text-[15px] font-bold text-ink">再接続する</button>
          </div>
        )}
        {started && !call.remoteJoined && call.status === "connected" && timer.left > 0 && (
          <div className="absolute left-4 right-4 rounded-xl bg-[#1C2A3A] px-3 py-2 text-center text-xs text-[#CFE3F5]" style={{ bottom: "calc(env(safe-area-inset-bottom) + 150px)" }}>
            {p.name}の接続が切れました。残り時間内なら戻ってこられます
          </div>
        )}
        {timer.left === 0 && started && (
          <div className="absolute left-4 right-4 rounded-xl bg-[#3A1C24] px-3 py-2 text-center text-xs text-rose" style={{ bottom: "calc(env(safe-area-inset-bottom) + 150px)" }}>
            ご予約の時間になりました。終了ボタンで鑑定を終えてください
          </div>
        )}

        {/* 操作ボタン */}
        <div className="absolute inset-x-0 bottom-0 grid grid-cols-5 gap-1 rounded-t-[28px] bg-night px-4 pt-[18px]" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}>
          <CtrlButton label="マイク" onClick={call.toggleMic} tone={call.micOn ? "base" : "off"}>
            {call.micOn ? <IMic /> : <IMicOff />}
          </CtrlButton>
          {audioOnly ? (
            <CtrlButton label="スピーカー" onClick={() => {}}>
              <ISpeaker />
            </CtrlButton>
          ) : (
            <CtrlButton label="カメラ" onClick={call.toggleCam} tone={call.camOn ? "base" : "off"}>
              <IVideo />
            </CtrlButton>
          )}
          <CtrlButton label="感謝を贈る" onClick={() => setGift(true)} tone="gold">
            <IGift />
          </CtrlButton>
          <CtrlButton label="ワイプ" onClick={call.togglePip}>
            <IPip />
          </CtrlButton>
          <CtrlButton label="終了" onClick={end} tone="red">
            <IEnd />
          </CtrlButton>
        </div>

        {gift && <GiftSheet provider={p} onClose={() => setGift(false)} onSent={setToast} />}
      </div>
    </div>
  );
}

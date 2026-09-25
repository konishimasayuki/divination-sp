"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp, useGuard } from "@/lib/store";
import { list, ymd, fmtPt } from "@/lib/db";
import { SLOT_TIMES } from "@/lib/providers-data";
import type { Booking } from "@/lib/types";
import { BackHeader, Loading, Screen } from "@/components/ui";

const DOW = ["日", "月", "火", "水", "木", "金", "土"];
const COURSES = [15, 30, 60];

export default function BookingPage() {
  const ok = useGuard("user");
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { providers } = useApp();
  const p = providers.find((x) => x.id === id);
  const [method, setMethod] = useState<"video" | "voice">("video");
  const [minutes, setMinutes] = useState(30);
  const [dayIdx, setDayIdx] = useState(0);
  const [slot, setSlot] = useState<number | null>(null);
  const [taken, setTaken] = useState<Booking[]>([]);

  const days = useMemo(() => {
    const out: Date[] = [];
    const base = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      out.push(d);
    }
    return out;
  }, []);

  useEffect(() => {
    list<Booking>("bookings", { providerId: id }).then((b) => setTaken(b.filter((x) => x.status === "reserved")));
  }, [id]);

  if (!ok) return <Screen><Loading /></Screen>;
  if (!p) return <Screen><Loading label="先生が見つかりません" /></Screen>;

  const rate = method === "video" ? p.callRate : p.voiceRate;
  const day = days[dayIdx];
  const date = ymd(day);
  const open = (p.schedule?.[String(day.getDay())] ?? []).slice().sort((a, b) => a - b);
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const slots = open.map((i) => {
    const [hh, mm] = SLOT_TIMES[i].split(":").map(Number);
    const min = (hh < 6 ? hh + 24 : hh) * 60 + mm;
    const past = dayIdx === 0 && min <= nowMin + 10;
    const busy = taken.some((b) => b.date === date && b.time === SLOT_TIMES[i]);
    return { i, label: SLOT_TIMES[i], off: past || busy };
  });
  const total = minutes * rate;

  function next() {
    if (slot === null || !p) return;
    sessionStorage.setItem(
      "booking_draft",
      JSON.stringify({ providerId: p.id, method, minutes, date, time: SLOT_TIMES[slot], points: total })
    );
    router.push("/checkout");
  }

  const sel = (on: boolean) => (on ? "border-gold bg-deep" : "border-line bg-card");

  return (
    <Screen
      bottom={
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <div className="text-[11px] text-mute">
              {method === "video" ? "ビデオ" : "音声"} {minutes}分{slot !== null ? ` ・ ${day.getDate()}日 ${SLOT_TIMES[slot]}` : ""}
            </div>
            <div className="text-xl font-bold text-gold">{fmtPt(total)}</div>
          </div>
          <button onClick={next} disabled={slot === null} className="flex h-[52px] flex-1 items-center justify-center rounded-[14px] bg-gold text-[15px] font-bold text-ink disabled:opacity-40">
            {slot === null ? "時間を選んでください" : "確認へ進む"}
          </button>
        </div>
      }
    >
      <BackHeader href={`/tellers/${p.id}`}>
        <img src={p.photo} alt="" className="h-8 w-8 rounded-full object-cover" />
        <span className="ml-1 truncate font-mincho text-[17px] font-bold">{p.name}を予約</span>
      </BackHeader>

      <div className="flex flex-col gap-[18px] px-4 pb-6">
        <section>
          <div className="mb-2 text-[13px] font-medium text-lav">相談方法</div>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["video", "ビデオ通話", `${p.callRate}pt / 分`],
                ["voice", "音声通話", `顔出しなし ・ ${p.voiceRate}pt / 分`],
              ] as const
            ).map(([k, label, sub]) => (
              <button key={k} onClick={() => setMethod(k)} className={`flex h-16 flex-col items-center justify-center gap-0.5 rounded-[14px] border ${sel(method === k)}`}>
                <span className="text-sm font-bold">{label}</span>
                <span className="text-[11px] text-mute">{sub}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-2 text-[13px] font-medium text-lav">コース</div>
          <div className="grid grid-cols-3 gap-2">
            {COURSES.map((m) => (
              <button key={m} onClick={() => setMinutes(m)} className={`flex h-16 flex-col items-center justify-center gap-0.5 rounded-[14px] border ${sel(minutes === m)}`}>
                <span className="text-[15px] font-bold">{m}分</span>
                <span className="text-xs text-gold">{fmtPt(m * rate)}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-2 text-[13px] font-medium text-lav">日にち</div>
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
            {days.map((d, i) => (
              <button
                key={i}
                onClick={() => {
                  setDayIdx(i);
                  setSlot(null);
                }}
                className={`flex h-[60px] w-[52px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-[14px] border ${
                  dayIdx === i ? "border-gold bg-gold text-ink" : "border-line bg-card text-text"
                }`}
              >
                <span className="text-[11px]">{i === 0 ? "今日" : DOW[d.getDay()]}</span>
                <span className="text-[17px] font-bold">{d.getDate()}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-2 text-[13px] font-medium text-lav">開始時間</div>
          {slots.length === 0 ? (
            <p className="rounded-xl bg-card p-4 text-center text-xs text-mute">この日は受付がありません。別の日をお選びください。</p>
          ) : (
            <div className="grid grid-cols-4 gap-1.5">
              {slots.map((s) => (
                <button
                  key={s.i}
                  disabled={s.off}
                  onClick={() => setSlot(s.i)}
                  className={`h-11 rounded-xl border text-sm font-medium ${
                    s.off
                      ? "border-[#231D42] bg-night text-faint line-through"
                      : slot === s.i
                      ? "border-gold bg-gold text-ink"
                      : "border-line bg-card text-text"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </Screen>
  );
}

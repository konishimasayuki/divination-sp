"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useProviderMe } from "@/lib/useProviderMe";
import { list } from "@/lib/db";
import type { Booking } from "@/lib/types";
import { DAY_TIMES, TIME_BANDS, addDays, dateOf, openTimes, toMin, ymdOf } from "@/lib/availability";
import { BackHeader, Loading, Screen, btnGold } from "@/components/ui";

const DOW = ["日", "月", "火", "水", "木", "金", "土"];
const KEEP_DAYS = 120; // 保存する範囲(今日から)

// 月のカレンダー(日曜はじまり)。前後の月の日は null
function monthCells(y: number, m: number) {
  const first = new Date(y, m, 1);
  const days = new Date(y, m + 1, 0).getDate();
  const cells: (string | null)[] = Array(first.getDay()).fill(null);
  for (let d = 1; d <= days; d++) cells.push(ymdOf(new Date(y, m, d)));
  while (cells.length % 7) cells.push(null);
  return cells;
}

export default function Schedule() {
  const { ok, me, app } = useProviderMe();
  const router = useRouter();
  const today = ymdOf(new Date());
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [sel, setSel] = useState(today);
  const [dates, setDates] = useState<Record<string, string[]> | null>(null);
  const [now, setNow] = useState<boolean | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!me) return;
    list<Booking>("bookings", { providerId: me.id }).then((b) => setBookings(b.filter((x) => x.status === "reserved")));
  }, [me]);

  // 初回: 旧方式(曜日ごと)の先生は、今の設定を日付ごとに展開して表示する
  useEffect(() => {
    if (!me || dates) return;
    if (me.dates) {
      setDates(me.dates);
      return;
    }
    const out: Record<string, string[]> = {};
    for (let i = 0; i < 60; i++) {
      const d = addDays(today, i);
      const t = openTimes(me, d);
      if (t.length) out[d] = t;
    }
    setDates(out);
  }, [me, dates, today]);

  const cells = useMemo(() => monthCells(month.y, month.m), [month]);

  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(""), 2500);
    return () => clearTimeout(t);
  }, [note]);

  if (!ok || !me || !dates) return <Screen><Loading /></Screen>;

  const acceptNow = now ?? me.acceptNow ?? true;
  const cur = dates[sel] ?? [];
  const dayBookings = bookings.filter((b) => b.date === sel).sort((a, b) => toMin(a.time) - toMin(b.time));
  const bookedTimes = new Set<string>();
  dayBookings.forEach((b) => {
    for (let t = toMin(b.time); t < toMin(b.time) + b.minutes; t += 30) bookedTimes.add(DAY_TIMES[Math.floor(t / 30)] ?? "");
  });
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const isPastTime = (t: string) => sel === today && toMin(t) <= nowMin;
  const selPast = sel < today;

  const setDay = (ymd: string, times: string[]) => {
    const next = { ...dates };
    const uniq = Array.from(new Set(times)).sort((a, b) => toMin(a) - toMin(b));
    if (uniq.length) next[ymd] = uniq;
    else delete next[ymd];
    setDates(next);
    setDirty(true);
  };
  const toggle = (t: string) => setDay(sel, cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]);
  const setBand = (from: number, to: number, on: boolean) => {
    const band = DAY_TIMES.slice(from, to).filter((t) => !isPastTime(t));
    setDay(sel, on ? [...cur, ...band] : cur.filter((t) => !band.includes(t) || bookedTimes.has(t)));
  };

  // この日の設定を他の日にコピー
  const copyTo = (targets: string[], label: string) => {
    const next = { ...dates };
    targets.forEach((d) => {
      if (cur.length) next[d] = [...cur];
      else delete next[d];
    });
    setDates(next);
    setDirty(true);
    setNote(`${label}にコピーしました`);
  };
  const sameDow = (weeks: number) => Array.from({ length: weeks }, (_, i) => addDays(sel, (i + 1) * 7));
  const nextDays = (n: number) => Array.from({ length: n }, (_, i) => addDays(sel, i + 1));
  const weekdaysThisMonth = () => {
    const d = dateOf(sel);
    return monthCells(d.getFullYear(), d.getMonth()).filter((x): x is string => !!x && x > sel && ![0, 6].includes(dateOf(x).getDay()));
  };

  async function save() {
    if (!me || !dates) return;
    setBusy(true);
    const limit = addDays(today, KEEP_DAYS);
    const pruned = Object.fromEntries(Object.entries(dates).filter(([d, t]) => d >= today && d <= limit && t.length));
    await app.saveProvider(me.id, { dates: pruned, acceptNow });
    setBusy(false);
    router.replace("/provider");
  }

  const selDate = dateOf(sel);
  const canPrev = month.y > new Date().getFullYear() || month.m > new Date().getMonth();

  return (
    <Screen
      bottom={
        <button onClick={save} disabled={busy} className={`${btnGold} w-full`}>
          {busy ? "保存しています" : dirty || now !== null ? "変更を保存する" : "保存する"}
        </button>
      }
    >
      <BackHeader title="受付時間の設定" href="/provider" />
      <p className="px-4 text-xs leading-[1.7] text-lav">日にちを選んで、お客様が予約できる時間(30分ごと・24時間)を設定します。</p>

      {/* カレンダー */}
      <div className="mx-4 mt-3 rounded-[18px] border border-line bg-card p-3">
        <div className="mb-2 flex items-center justify-between">
          <button
            onClick={() => setMonth(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }))}
            disabled={!canPrev}
            aria-label="前の月"
            className="flex h-9 w-9 items-center justify-center text-lg text-lav disabled:opacity-25"
          >
            ‹
          </button>
          <span className="font-mincho text-base font-bold">{month.y}年{month.m + 1}月</span>
          <button onClick={() => setMonth(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }))} aria-label="次の月" className="flex h-9 w-9 items-center justify-center text-lg text-lav">
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
          {DOW.map((d, i) => (
            <span key={d} className={i === 0 ? "text-rose" : i === 6 ? "text-sky" : "text-mute"}>{d}</span>
          ))}
          {cells.map((d, i) => {
            if (!d) return <span key={i} />;
            const n = (dates[d] ?? []).length;
            const bk = bookings.filter((b) => b.date === d).length;
            const past = d < today;
            const on = d === sel;
            return (
              <button
                key={d}
                onClick={() => setSel(d)}
                className={`relative flex h-12 flex-col items-center justify-center rounded-[10px] border ${
                  on ? "border-gold bg-gold text-ink" : d === today ? "border-gold/60 bg-deep" : n ? "border-line bg-deep" : "border-transparent"
                } ${past && !on ? "opacity-35" : ""}`}
              >
                <span className="text-[13px] font-bold leading-none">{dateOf(d).getDate()}</span>
                <span className={`mt-1 text-[9px] leading-none ${on ? "text-ink" : n ? "text-gold" : "text-faint"}`}>{n ? `${n}枠` : "−"}</span>
                {bk > 0 && (
                  <span className={`absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold ${on ? "bg-ink text-gold" : "bg-rose text-ink"}`}>
                    {bk}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex items-center gap-3 text-[10px] text-mute">
          <span className="flex items-center gap-1"><span className="text-gold">8枠</span>受付あり</span>
          <span className="flex items-center gap-1"><span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose text-[8px] font-bold text-ink">2</span>予約が入っている</span>
        </div>
      </div>

      {/* 選んだ日 */}
      <div className="mx-4 mt-4 flex items-baseline justify-between">
        <span className="font-mincho text-[17px] font-bold">
          {selDate.getMonth() + 1}月{selDate.getDate()}日({DOW[selDate.getDay()]})
        </span>
        <span className="text-xs text-mute">{cur.length}枠 受付</span>
      </div>

      {dayBookings.length > 0 && (
        <div className="mx-4 mt-2 flex flex-col gap-1.5">
          {dayBookings.map((b) => (
            <div key={b.id} className="flex items-center gap-2.5 rounded-xl border border-rose/50 bg-[#2A1830] px-3 py-2 text-[13px]">
              <span className="font-bold text-rose">{b.time}〜</span>
              <span className="min-w-0 flex-1 truncate">{b.userName} さん</span>
              <span className="text-[11px] text-mute">{b.method === "video" ? "ビデオ" : "音声"}{b.minutes}分</span>
            </div>
          ))}
        </div>
      )}

      {selPast ? (
        <p className="mx-4 mt-3 rounded-xl bg-card p-4 text-center text-xs text-mute">過ぎた日は変更できません</p>
      ) : (
        <>
          {TIME_BANDS.map((band) => {
            const times = DAY_TIMES.slice(band.from, band.to);
            const editable = times.filter((t) => !isPastTime(t));
            const allOn = editable.length > 0 && editable.every((t) => cur.includes(t));
            return (
              <section key={band.label} className="mx-4 mt-3.5">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[12px] font-medium text-lav">
                    {band.label} <span className="text-faint">{times[0]}〜{times[times.length - 1]}</span>
                  </span>
                  {editable.length > 0 && (
                    <button onClick={() => setBand(band.from, band.to, !allOn)} className="h-7 text-[11px] text-gold">
                      {allOn ? "まとめて外す" : "まとめて選ぶ"}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {times.map((t) => {
                    const on = cur.includes(t);
                    const booked = bookedTimes.has(t);
                    const past = isPastTime(t);
                    return (
                      <button
                        key={t}
                        disabled={past || (booked && on)}
                        onClick={() => toggle(t)}
                        className={`relative h-11 rounded-xl border text-[13px] font-medium ${
                          booked ? "border-rose bg-[#2A1830] text-text" : on ? "border-gold bg-deep text-text" : "border-deep text-faint"
                        } ${past ? "opacity-30" : ""}`}
                      >
                        {t}
                        {booked && <span className="absolute inset-x-0 bottom-0.5 text-[8px] leading-none text-rose">予約あり</span>}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}

          <section className="mx-4 mt-4 rounded-[14px] bg-card p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12px] font-bold">この日の設定をコピー</span>
              {note && <span className="text-[11px] text-mint-hi">{note}</span>}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={() => copyTo(sameDow(4), `毎週${DOW[selDate.getDay()]}曜(4週)`)} className="h-10 rounded-[10px] border border-edge text-[12px]">毎週{DOW[selDate.getDay()]}曜 4週先まで</button>
              <button onClick={() => copyTo(sameDow(12), `毎週${DOW[selDate.getDay()]}曜(12週)`)} className="h-10 rounded-[10px] border border-edge text-[12px]">毎週{DOW[selDate.getDay()]}曜 3か月先まで</button>
              <button onClick={() => copyTo(nextDays(6), "翌日から6日間")} className="h-10 rounded-[10px] border border-edge text-[12px]">翌日から1週間</button>
              <button onClick={() => copyTo(weekdaysThisMonth(), "今月の残りの平日")} className="h-10 rounded-[10px] border border-edge text-[12px]">今月の残りの平日</button>
            </div>
            <button onClick={() => setDay(sel, cur.filter((t) => bookedTimes.has(t)))} className="mt-1.5 h-9 w-full text-[12px] text-rose">この日の受付をすべて外す</button>
          </section>
        </>
      )}

      <div className="mx-4 mb-6 mt-4 flex items-center justify-between rounded-[14px] bg-card px-3.5 py-3">
        <div>
          <div className="text-[13px] font-bold">予約なしの「今すぐ通話」も受ける</div>
          <div className="mt-0.5 text-[11px] text-mute">待機中のときだけお客様に表示されます</div>
        </div>
        <button onClick={() => setNow(!acceptNow)} aria-label="今すぐ通話の受付を切り替え" className={`relative h-[30px] w-[52px] shrink-0 rounded-full ${acceptNow ? "bg-gold" : "bg-edge"}`}>
          <span className="absolute top-[3px] h-6 w-6 rounded-full bg-text transition-all" style={{ left: acceptNow ? 25 : 3 }} />
        </button>
      </div>
    </Screen>
  );
}

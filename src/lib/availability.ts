import { SLOT_TIMES, type Provider } from "./providers-data";
import type { Booking } from "./types";

// 30分刻みの24時間(00:00〜23:30)
export const DAY_TIMES = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);

export const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export function ymdOf(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function dateOf(ymd: string) {
  return new Date(`${ymd}T00:00:00`);
}
export function addDays(ymd: string, n: number) {
  const d = dateOf(ymd);
  d.setDate(d.getDate() + n);
  return ymdOf(d);
}

// 旧方式(曜日ごと・18:00〜翌1:30)から、その日の受付時間を作る(移行前の先生用)
function legacyTimes(p: Provider, ymd: string): string[] {
  const s = p.schedule ?? {};
  const dow = dateOf(ymd).getDay();
  const prevDow = (dow + 6) % 7;
  const out: string[] = [];
  (s[String(dow)] ?? []).forEach((i) => {
    if (18 + Math.floor(i / 2) < 24) out.push(SLOT_TIMES[i]);
  });
  // 前日の24時以降の枠は、この日の0時台として扱う
  (s[String(prevDow)] ?? []).forEach((i) => {
    if (18 + Math.floor(i / 2) >= 24) out.push(SLOT_TIMES[i]);
  });
  return out.sort((a, b) => toMin(a) - toMin(b));
}

// その日の受付時間
export function openTimes(p: Provider, ymd: string): string[] {
  if (p.dates) return [...(p.dates[ymd] ?? [])].sort((a, b) => toMin(a) - toMin(b));
  return legacyTimes(p, ymd);
}

// 予約と重なるか(開始〜コース時間の範囲で判定)
export function overlaps(ymd: string, time: string, minutes: number, b: Pick<Booking, "date" | "time" | "minutes">) {
  const start = dateOf(ymd).getTime() + toMin(time) * 60000;
  const end = start + minutes * 60000;
  const bs = dateOf(b.date).getTime() + toMin(b.time) * 60000;
  const be = bs + b.minutes * 60000;
  return start < be && bs < end;
}

// 時間帯の見出し
export const TIME_BANDS = [
  { label: "深夜", from: 0, to: 12 },
  { label: "朝", from: 12, to: 24 },
  { label: "昼", from: 24, to: 36 },
  { label: "夜", from: 36, to: 48 },
] as const;

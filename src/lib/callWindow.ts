import type { Booking } from "./types";

// 鑑定の時間枠。startedAt(双方がつながった時刻)から「準備時間+コース時間」の間は再入室できる
export function callWindow(b: Pick<Booking, "startedAt" | "minutes">, prepMinutes: number, now = Date.now()) {
  const totalSec = (b.minutes + prepMinutes) * 60;
  if (!b.startedAt) return { started: false, expired: false, totalSec, leftSec: totalSec, leftMin: Math.ceil(totalSec / 60), endsAt: null as number | null };
  const endsAt = b.startedAt + totalSec * 1000;
  const leftSec = Math.max(0, Math.floor((endsAt - now) / 1000));
  return { started: true, expired: leftSec === 0, totalSec, leftSec, leftMin: Math.max(1, Math.ceil(leftSec / 60)), endsAt };
}

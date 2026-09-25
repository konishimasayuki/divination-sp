"use client";

import { useEffect, useState } from "react";
import { fmtDay, fmtPt, list, update } from "@/lib/db";
import type { Booking } from "@/lib/types";
import { AdminShell, panel } from "@/components/AdminShell";
import { Chip } from "@/components/ui";

const ST = { reserved: ["予約中", "text-gold"], done: ["終了", "text-mint-hi"], canceled: ["キャンセル", "text-dim"] } as const;

export default function AdminBookings() {
  const [rows, setRows] = useState<Booking[]>([]);
  const [f, setF] = useState<"all" | Booking["status"]>("all");

  useEffect(() => {
    list<Booking>("bookings").then((b) => setRows(b.sort((a, c) => c.createdAt - a.createdAt)));
  }, []);

  async function cancel(b: Booking) {
    if (!confirm(`${b.userName}さんの予約をキャンセル扱いにしますか?(ポイントの返還は行われません)`)) return;
    await update("bookings", b.id, { status: "canceled" });
    setRows(rows.map((x) => (x.id === b.id ? { ...x, status: "canceled" } : x)));
  }

  const shown = rows.filter((b) => f === "all" || b.status === f);

  return (
    <AdminShell title="予約・鑑定ログ" sub={`全${rows.length}件`}>
      <div className="flex gap-2">
        {([["all", "すべて"], ["reserved", "予約中"], ["done", "終了"], ["canceled", "キャンセル"]] as const).map(([k, l]) => (
          <Chip key={k} on={f === k} onClick={() => setF(k)}>{l}</Chip>
        ))}
      </div>
      <div className={`${panel} mt-4 overflow-x-auto p-0 lg:p-0`}>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs text-dim">
            <tr className="border-b border-deep">
              <th className="px-4 py-3 font-normal">日時</th><th className="font-normal">会員</th><th className="font-normal">占い師</th><th className="font-normal">内容</th><th className="text-right font-normal">ポイント</th><th className="text-center font-normal">状態</th><th className="px-4 text-right font-normal">操作</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-mute">予約はありません</td></tr>}
            {shown.map((b) => (
              <tr key={b.id} className="border-b border-[#211B3E]">
                <td className="px-4 py-3">{fmtDay(b.date)} {b.time}</td>
                <td className="font-bold">{b.userName}</td>
                <td>{b.providerName}</td>
                <td className="text-lav">{b.method === "video" ? "ビデオ" : "音声"} {b.minutes}分{b.note ? ` ・ ${b.note.slice(0, 16)}` : ""}</td>
                <td className="text-right">{fmtPt(b.points)}</td>
                <td className={`text-center text-xs ${ST[b.status][1]}`}>{ST[b.status][0]}</td>
                <td className="px-4 text-right">
                  {b.status === "reserved" && <button onClick={() => cancel(b)} className="text-xs text-rose">キャンセル</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

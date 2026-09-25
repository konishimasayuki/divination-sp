"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { fmtPt, list } from "@/lib/db";
import type { HistoryItem, Payout, User } from "@/lib/types";
import { AdminShell, panel } from "@/components/AdminShell";

const KIND: Record<HistoryItem["kind"], string> = { talk: "通話予約", msg: "メッセージ", palm: "AI手相", goods: "グッズ", buy: "ポイント購入", gift: "感謝", bonus: "特典" };

export default function AdminDashboard() {
  const { providers } = useApp();
  const [hist, setHist] = useState<HistoryItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    list<HistoryItem>("history").then(setHist);
    list<User>("users").then(setUsers);
    list<Payout>("payouts", { status: "pending" }).then((p) => setPending(p.length));
  }, []);

  const now = new Date();
  const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const today = dayStart(now);
  const spendOf = (items: HistoryItem[]) => items.filter((h) => h.points < 0).reduce((s, h) => s + Math.abs(h.points), 0);
  const todays = hist.filter((h) => h.createdAt >= today);
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (13 - i));
    const s = dayStart(d);
    return { label: `${d.getMonth() + 1}/${d.getDate()}`, value: spendOf(hist.filter((h) => h.createdAt >= s && h.createdAt < s + 86400000)) };
  });
  const max = Math.max(1, ...days.map((d) => d.value));
  const uname = (id: string) => users.find((u) => u.id === id)?.name ?? "-";
  const pname = (id?: string) => providers.find((p) => p.id === id)?.name ?? "—";
  const recent = [...hist].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8);
  const statusCount = (s: string) => providers.filter((p) => p.status === s).length;

  return (
    <AdminShell
      title="ダッシュボード"
      sub={`${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} 時点`}
      actions={
        pending > 0 ? (
          <Link href="/admin/payout" className="hidden h-10 shrink-0 items-center gap-2 rounded-[10px] border border-rose px-4 text-[13px] text-[#F0A9B4] sm:flex">
            <span className="h-[7px] w-[7px] rounded-full bg-rose" />
            出金申請 {pending}件 承認待ち
          </Link>
        ) : null
      }
    >
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          ["本日の売上", fmtPt(spendOf(todays)), `ポイント購入 ${fmtPt(todays.filter((h) => h.kind === "buy").reduce((s, h) => s + h.points, 0))}`, true],
          ["本日の鑑定", `${todays.filter((h) => ["talk", "msg", "palm"].includes(h.kind)).length}件`, `通話 ${todays.filter((h) => h.kind === "talk").length} ・ メッセージ ${todays.filter((h) => h.kind === "msg").length} ・ 手相 ${todays.filter((h) => h.kind === "palm").length}`, false],
          ["新規会員", `${users.filter((u) => u.createdAt >= today).length}人`, `累計 ${users.length}人`, false],
          ["待機中の占い師", `${statusCount("available")} / ${providers.length}名`, `鑑定中 ${statusCount("busy")} ・ 休止中 ${statusCount("off")}`, false],
        ].map(([k, v, s, gold]) => (
          <div key={k as string} className={panel}>
            <div className="text-[13px] text-mute">{k}</div>
            <div className={`mt-1.5 text-2xl font-bold lg:text-[28px] ${gold ? "text-gold" : ""}`}>{v}</div>
            <div className="mt-1 text-xs text-mute">{s}</div>
          </div>
        ))}
      </div>

      <div className="mt-3.5 grid gap-3.5 xl:grid-cols-[2fr_1fr]">
        <div className={panel}>
          <div className="flex items-baseline justify-between">
            <span className="text-[15px] font-bold">売上の推移(直近14日)</span>
            <span className="text-xs text-mute">ポイント消費ベース</span>
          </div>
          <div className="mt-4 flex h-52 items-end gap-1.5 lg:gap-2.5">
            {days.map((d, i) => (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[9px] text-dim">{d.value ? Math.round(d.value / 100) / 10 + "k" : ""}</span>
                <div className={`w-full rounded-md ${i === 13 ? "bg-gold" : "bg-edge"}`} style={{ height: `${Math.max(3, (d.value / max) * 160)}px` }} />
                <span className={`text-[10px] ${i === 13 ? "text-gold" : "text-dim"}`}>{i === 13 ? "今日" : i % 2 === 0 ? d.label : ""}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`${panel} flex flex-col gap-3`}>
          <span className="text-[15px] font-bold">占い師の稼働状況</span>
          {providers.map((p) => (
            <div key={p.id} className="flex items-center gap-2.5">
              <img src={p.photo} alt="" className="h-9 w-9 rounded-full object-cover" />
              <span className="flex-1 truncate text-sm">{p.name}</span>
              <span className={`text-xs ${p.status === "available" ? "text-mint" : p.status === "busy" ? "text-gold" : "text-dim"}`}>
                ● {p.status === "available" ? "待機中" : p.status === "busy" ? "鑑定中" : "休止中"}
              </span>
            </div>
          ))}
          <div className="text-[11px] text-dim">状態は占い師本人が切り替えます</div>
        </div>
      </div>

      <div className={`${panel} mt-3.5 overflow-x-auto`}>
        <div className="mb-2.5 text-[15px] font-bold">最近の取引</div>
        <table className="w-full min-w-[640px] text-left text-[13px]">
          <thead className="text-dim">
            <tr className="border-b border-deep">
              <th className="py-2 font-normal">日時</th><th className="py-2 font-normal">会員</th><th className="py-2 font-normal">内容</th><th className="py-2 font-normal">占い師</th><th className="py-2 text-right font-normal">ポイント</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-mute">まだ取引はありません</td></tr>}
            {recent.map((h) => (
              <tr key={h.id} className="border-b border-[#211B3E]">
                <td className="py-2.5">{new Date(h.createdAt).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                <td>{uname(h.userId)}</td>
                <td>{KIND[h.kind]} {h.detail && <span className="text-mute">・{h.detail}</span>}</td>
                <td className={h.providerId ? "" : "text-dim"}>{pname(h.providerId)}</td>
                <td className={`text-right ${h.points > 0 ? "text-mint-hi" : ""}`}>{h.points > 0 ? "+" : ""}{h.points.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import { fmtBirth, fmtPt, list, update, zodiacOf } from "@/lib/db";
import type { HistoryItem, User } from "@/lib/types";
import { AdminShell, panel } from "@/components/AdminShell";
import { Chip } from "@/components/ui";

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [hist, setHist] = useState<HistoryItem[]>([]);
  const [q, setQ] = useState("");
  const [f, setF] = useState("all");

  useEffect(() => {
    list<User>("users").then((u) => setUsers(u.sort((a, b) => b.createdAt - a.createdAt)));
    list<HistoryItem>("history").then(setHist);
  }, []);

  const spent = (id: string) => hist.filter((h) => h.userId === id && h.points < 0).reduce((s, h) => s + Math.abs(h.points), 0);
  const kind = (u: User) => (u.status === "stop" ? "stop" : spent(u.id) >= 10000 ? "vip" : spent(u.id) === 0 ? "new" : "active");
  const LABEL = { active: ["利用中", "bg-[#1F3A33] text-mint-hi"], vip: ["常連", "bg-[#3A2F18] text-gold-hi"], new: ["未利用", "bg-deep text-lav"], stop: ["停止中", "bg-[#3A1C24] text-[#F0A9B4]"] } as const;
  const rows = users.filter((u) => (!q || u.name.includes(q) || u.email.includes(q)) && (f === "all" || kind(u) === f));
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const activeThisMonth = new Set(hist.filter((h) => h.createdAt >= monthStart && h.points < 0).map((h) => h.userId)).size;

  function csv() {
    const lines = [["名前", "メール", "生年月日", "血液型", "保有pt", "累計利用pt", "登録日"].join(",")].concat(
      users.map((u) => [u.name, u.email, u.birthday, u.bloodType, u.points, spent(u.id), new Date(u.createdAt).toLocaleDateString("ja-JP")].join(","))
    );
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "members.csv";
    a.click();
  }

  async function toggleStop(u: User) {
    const next = u.status === "stop" ? "active" : "stop";
    await update("users", u.id, { status: next });
    setUsers(users.map((x) => (x.id === u.id ? { ...x, status: next } : x)));
  }

  return (
    <AdminShell
      title="会員管理"
      sub={`登録会員 ${users.length}人 ・ 今月の利用者 ${activeThisMonth}人`}
      actions={<button onClick={csv} className="h-10 shrink-0 rounded-[10px] border border-edge px-4 text-[13px] text-soft">CSV出力</button>}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label htmlFor="us" className="sr-only">会員を検索</label>
        <input id="us" value={q} onChange={(e) => setQ(e.target.value)} placeholder="名前・メールで検索" className="h-[42px] rounded-[10px] border border-edge bg-night px-3.5 text-sm outline-none focus:border-gold sm:w-72" />
        <div className="flex gap-2">
          {[["all", "すべて"], ["vip", "常連"], ["new", "未利用"], ["stop", "停止中"]].map(([k, l]) => (
            <Chip key={k} on={f === k} onClick={() => setF(k)}>{l}</Chip>
          ))}
        </div>
      </div>

      <div className={`${panel} mt-4 overflow-x-auto p-0 lg:p-0`}>
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="text-xs text-dim">
            <tr className="border-b border-deep">
              <th className="px-4 py-3 font-normal">会員</th><th className="font-normal">メール</th><th className="font-normal">生年月日</th><th className="font-normal">登録日</th><th className="text-right font-normal">保有pt</th><th className="text-right font-normal">累計利用</th><th className="text-center font-normal">状態</th><th className="px-4 text-right font-normal">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-mute">該当する会員はいません</td></tr>}
            {rows.map((u) => {
              const k = kind(u);
              return (
                <tr key={u.id} className="border-b border-[#211B3E]">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2.5 font-bold">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-deep text-[13px] text-lav">{u.name.charAt(0)}</span>
                      {u.name}
                    </span>
                  </td>
                  <td className="max-w-[200px] truncate text-lav">{u.email}</td>
                  <td className="text-lav">{fmtBirth(u.birthday)} {zodiacOf(u.birthday)}</td>
                  <td className="text-lav">{new Date(u.createdAt).toLocaleDateString("ja-JP")}</td>
                  <td className="text-right">{u.points.toLocaleString()}</td>
                  <td className="text-right font-bold">{fmtPt(spent(u.id))}</td>
                  <td className="text-center"><span className={`rounded-full px-2.5 py-0.5 text-[11px] ${LABEL[k][1]}`}>{LABEL[k][0]}</span></td>
                  <td className="px-4 text-right">
                    <button onClick={() => toggleStop(u)} className={`text-xs ${u.status === "stop" ? "text-mint-hi" : "text-rose"}`}>{u.status === "stop" ? "再開" : "停止"}</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

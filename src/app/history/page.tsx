"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp, useGuard } from "@/lib/store";
import { fmtDate, fmtDay, fmtPt, list } from "@/lib/db";
import type { Booking, HistoryItem, PalmReading } from "@/lib/types";
import { BackHeader, Chip, Loading, Screen } from "@/components/ui";

const TAGS: Record<HistoryItem["kind"], string> = { talk: "通話", msg: "文字", palm: "手相", goods: "物販", buy: "購入", gift: "感謝", bonus: "特典" };
const FILTERS: [string, string][] = [["all", "すべて"], ["talk", "鑑定"], ["palm", "手相"], ["goods", "グッズ"], ["buy", "購入"]];

export default function History() {
  const ok = useGuard("user");
  const { user, providers } = useApp();
  const [rows, setRows] = useState<HistoryItem[] | null>(null);
  const [next, setNext] = useState<Booking | null>(null);
  const [palms, setPalms] = useState<PalmReading[]>([]);
  const [f, setF] = useState("all");

  useEffect(() => {
    if (!user) return;
    if (typeof window !== "undefined" && window.location.search.includes("palm")) setF("palm");
    list<HistoryItem>("history", { userId: user.id }).then((r) => setRows(r.sort((a, b) => b.createdAt - a.createdAt)));
    list<Booking>("bookings", { userId: user.id, status: "reserved" }).then((b) => setNext(b.sort((a, c) => `${a.date}${a.time}`.localeCompare(`${c.date}${c.time}`))[0] ?? null));
    list<PalmReading>("palm", { userId: user.id }).then((p) => setPalms(p.sort((a, b) => b.createdAt - a.createdAt)));
  }, [user]);

  if (!ok || !user) return <Screen><Loading /></Screen>;
  const np = providers.find((p) => p.id === next?.providerId);
  const shown = (rows ?? []).filter((r) => f === "all" || (f === "talk" ? ["talk", "msg", "gift"].includes(r.kind) : f === "buy" ? ["buy", "bonus"].includes(r.kind) : r.kind === f));

  return (
    <Screen>
      <BackHeader title="予約・利用履歴" href="/mypage" />
      {next && np && (
        <div className="mx-4 mt-1 flex items-center gap-3 rounded-[18px] border border-gold bg-card p-4">
          <img src={np.photo} alt="" className="h-12 w-12 rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold text-gold">次の予約</div>
            <div className="mt-0.5 truncate text-sm font-bold">{np.name} ・ {next.minutes}分{next.method === "video" ? "ビデオ" : "音声"}</div>
            <div className="mt-0.5 text-xs text-lav">{fmtDay(next.date)} {next.time}〜</div>
          </div>
          <Link href={`/call/${next.id}`} className="flex h-10 items-center rounded-full bg-gold px-3.5 text-[13px] font-bold text-ink">入室</Link>
        </div>
      )}

      <div className="no-scrollbar mx-4 mt-[18px] flex gap-1.5 overflow-x-auto">
        {FILTERS.map(([k, l]) => (
          <Chip key={k} on={f === k} onClick={() => setF(k)}>{l}</Chip>
        ))}
      </div>

      {f === "palm" && palms.length > 0 && (
        <div className="mx-4 mt-3 flex flex-col gap-2">
          {palms.map((p) => {
            let kw = "鑑定結果";
            try {
              kw = JSON.parse(p.result).keyword.replaceAll("、", "");
            } catch {
              // no-op
            }
            return (
              <Link key={p.id} href={`/palm/result/${p.id}`} className="flex items-center justify-between rounded-xl bg-card px-3.5 py-3 text-text">
                <div>
                  <div className="font-mincho text-sm font-bold">{kw}</div>
                  <div className="text-[11px] text-mute">{fmtDate(p.createdAt)}</div>
                </div>
                <span className="text-xs text-gold">結果を見る ›</span>
              </Link>
            );
          })}
        </div>
      )}

      <div className="mx-4 mt-4 flex flex-col pb-8">
        {rows === null && <Loading />}
        {rows && shown.length === 0 && <p className="py-10 text-center text-sm text-mute">履歴はまだありません</p>}
        {shown.map((r) => (
          <div key={r.id} className="flex items-center gap-3 border-b border-[#231D42] px-1 py-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-xs font-bold text-gold">{TAGS[r.kind]}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{r.label}</div>
              <div className="mt-0.5 truncate text-[11px] text-mute">{fmtDate(r.createdAt)} ・ {r.detail}</div>
            </div>
            <span className={`shrink-0 text-sm font-bold ${r.points >= 0 ? "text-mint-hi" : "text-text"}`}>
              {r.points >= 0 ? "+" : "-"}
              {fmtPt(Math.abs(r.points))}
            </span>
          </div>
        ))}
      </div>
    </Screen>
  );
}

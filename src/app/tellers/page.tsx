"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp, useGuard } from "@/lib/store";
import { ISearch } from "@/components/icons";
import { BackHeader, Chip, Loading, Screen } from "@/components/ui";

const FILTERS = ["すべて", "待機中", "タロット", "四柱推命", "霊視", "AI"];

export default function Tellers() {
  const ok = useGuard("user");
  const { providers } = useApp();
  const [q, setQ] = useState("");
  const [f, setF] = useState("すべて");
  if (!ok) return <Screen><Loading /></Screen>;

  const rows = providers
    .filter((p) => p.visible !== false)
    .filter((p) => !q || p.name.includes(q) || p.tag.includes(q) || p.styleTags.some((t) => t.includes(q)))
    .filter((p) => {
      if (f === "すべて") return true;
      if (f === "待機中") return p.status === "available";
      if (f === "AI") return !!p.isAI;
      return p.tag.includes(f);
    });

  return (
    <Screen>
      <BackHeader title="占い師をさがす" href="/home" />
      <div className="relative mx-4">
        <label htmlFor="q" className="sr-only">キーワードで検索</label>
        <ISearch className="absolute left-3.5 top-[15px] text-mute" />
        <input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="名前・占術・お悩みで検索" className="h-12 w-full rounded-[14px] border border-edge bg-card pl-[42px] pr-3.5 text-sm outline-none focus:border-gold" />
      </div>
      <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto px-4">
        {FILTERS.map((l) => (
          <Chip key={l} on={f === l} onClick={() => setF(l)}>{l}</Chip>
        ))}
      </div>
      <div className="mx-4 mt-3.5 flex flex-col gap-2.5 pb-8">
        {rows.length === 0 && <p className="py-10 text-center text-sm text-mute">条件に合う先生が見つかりませんでした</p>}
        {rows.map((p) => (
          <Link key={p.id} href={`/tellers/${p.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3 text-text">
            <img src={p.photo} alt="" className="h-[60px] w-[60px] shrink-0 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[15px] font-bold">{p.name}</span>
                <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${p.status === "available" ? "bg-mint" : p.status === "busy" ? "bg-gold" : "bg-faint"}`} />
                <span className="shrink-0 text-[11px] text-lav">{p.status === "available" ? "待機中" : p.status === "busy" ? "鑑定中" : "休止中"}</span>
              </div>
              <div className="mt-0.5 truncate text-xs text-mute">{p.tag} ・ ★{p.rating}</div>
              <div className="mt-0.5 truncate text-xs text-gold">
                メッセージ {p.chatRate}pt/字 ・ 通話 {p.callRate}pt/分
              </div>
            </div>
            <span className="text-faint">›</span>
          </Link>
        ))}
      </div>
    </Screen>
  );
}

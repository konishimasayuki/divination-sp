"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useApp, useGuard } from "@/lib/store";
import { fmtDate, fmtPt, list } from "@/lib/db";
import type { PalmReading } from "@/lib/types";
import { PALM_LINES, PalmGuide } from "@/components/PalmGuide";
import { BackHeader, Loading, Screen, btnGold } from "@/components/ui";

type Result = { keyword: string; summary: string; life: string; heart: string; head: string; fate: string };

export default function PalmResult() {
  const ok = useGuard("user");
  const { id } = useParams<{ id: string }>();
  const { settings } = useApp();
  const [rec, setRec] = useState<PalmReading | null | undefined>(undefined);

  useEffect(() => {
    list<PalmReading>("palm", { id }).then((r) => setRec(r[0] ?? null));
  }, [id]);

  if (!ok || rec === undefined) return <Screen><Loading /></Screen>;
  if (!rec) return <Screen><BackHeader title="手相 鑑定結果" href="/palm" /><Loading label="鑑定結果が見つかりません" /></Screen>;

  let r: Result;
  try {
    r = JSON.parse(rec.result);
  } catch {
    r = { keyword: "あなたの手相", summary: rec.result, life: "", heart: "", head: "", fate: "" };
  }
  const [k1, ...k2] = r.keyword.split("、");

  return (
    <Screen
      bottom={
        <div className="flex flex-col gap-1">
          <Link href="/tellers" className={btnGold}>この結果を先生に詳しく相談する</Link>
          <Link href="/palm" className="flex h-11 items-center justify-center text-[13px] text-gold">もう一度撮影する</Link>
        </div>
      }
    >
      <BackHeader title="手相 鑑定結果" href="/palm" />
      <div className="mx-4 flex items-center gap-3.5 rounded-[20px] border border-line bg-card p-4">
        <div className="flex h-[116px] w-[92px] shrink-0 items-center justify-center rounded-[14px] bg-[#16112B]">
          <PalmGuide width={70} dashed={false} faint />
        </div>
        <div>
          <div className="text-[11px] font-bold text-gold">あなたの手相のキーワード</div>
          <div className="mt-1.5 font-mincho text-xl font-bold leading-normal">
            {k1}
            {k2.length > 0 && (
              <>
                、<br />
                {k2.join("、")}
              </>
            )}
          </div>
          <div className="mt-1.5 text-[11px] text-mute">{fmtDate(rec.createdAt)} 鑑定 ・ {fmtPt(settings.palmCost)}</div>
        </div>
      </div>

      <p className="mx-5 mt-4 font-mincho text-[15px] leading-[1.8]">{r.summary}</p>

      <div className="mx-4 mt-3.5 flex flex-col gap-2 pb-6">
        {PALM_LINES.map((l) =>
          r[l.key] ? (
            <div key={l.key} className="flex gap-3 rounded-[14px] bg-card px-3.5 py-3">
              <span className="w-1 shrink-0 rounded" style={{ background: l.color }} />
              <div>
                <div className="text-[13px] font-bold">{l.label}</div>
                <div className="mt-0.5 text-xs leading-[1.7] text-soft">{r[l.key]}</div>
              </div>
            </div>
          ) : null
        )}
        <p className="mt-2 text-center text-[10px] text-dim">AIによる鑑定はエンターテインメントとしてお楽しみください</p>
      </div>
    </Screen>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProviderMe } from "@/lib/useProviderMe";
import { SLOT_TIMES } from "@/lib/providers-data";
import { BackHeader, Loading, Screen, btnGold } from "@/components/ui";

const NAMES = ["日", "月", "火", "水", "木", "金", "土"];

export default function Schedule() {
  const { ok, me, app } = useProviderMe();
  const router = useRouter();
  const [day, setDay] = useState(new Date().getDay());
  const [sched, setSched] = useState<Record<string, number[]> | null>(null);
  const [now, setNow] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  if (!ok || !me) return <Screen><Loading /></Screen>;

  const s = sched ?? me.schedule ?? {};
  const acceptNow = now ?? me.acceptNow ?? true;
  const cur = s[String(day)] ?? [];
  const setDaySlots = (next: number[]) => setSched({ ...s, [String(day)]: next.sort((a, b) => a - b) });
  const full = cur.length === SLOT_TIMES.length;

  return (
    <Screen
      bottom={
        <button
          onClick={async () => {
            setBusy(true);
            await app.saveProvider(me.id, { schedule: s, acceptNow });
            router.replace("/provider");
          }}
          disabled={busy}
          className={`${btnGold} w-full`}
        >
          {busy ? "保存しています" : "保存する"}
        </button>
      }
    >
      <BackHeader title="受付時間の設定" href="/provider" />
      <p className="px-4 text-xs leading-[1.7] text-lav">お客様が予約できる時間を選んでください。毎週くり返し適用されます。</p>

      <div className="mx-4 mt-3.5 grid grid-cols-7 gap-[5px]">
        {NAMES.map((n, i) => (
          <button key={n} onClick={() => setDay(i)} className={`flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl border ${day === i ? "border-gold bg-gold text-ink" : "border-line bg-card text-text"}`}>
            <span className="text-sm font-bold">{n}</span>
            <span className="text-[10px]">{(s[String(i)] ?? []).length}枠</span>
          </button>
        ))}
      </div>

      <div className="mx-4 mb-2 mt-[18px] flex items-baseline justify-between">
        <span className="text-[13px] font-medium text-lav">{NAMES[day]}曜日の受付枠</span>
        <button onClick={() => setDaySlots(full ? [] : SLOT_TIMES.map((_, i) => i))} className="h-8 text-xs text-gold">
          {full ? "すべて外す" : "すべて選ぶ"}
        </button>
      </div>
      <div className="mx-4 grid grid-cols-4 gap-1.5">
        {SLOT_TIMES.map((t, i) => {
          const on = cur.includes(i);
          return (
            <button key={t} onClick={() => setDaySlots(on ? cur.filter((x) => x !== i) : [...cur, i])} className={`h-11 rounded-xl border text-[13px] font-medium ${on ? "border-gold bg-deep text-text" : "border-deep text-faint"}`}>
              {t}
            </button>
          );
        })}
      </div>

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

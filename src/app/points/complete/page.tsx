"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { fmtPt } from "@/lib/db";
import { Loading, Screen, btnGold, btnLine } from "@/components/ui";

type State = { status: string; credited: boolean; points: number; price: number } | null;

// PayPayの支払い後に戻ってくる画面。決済状況を確認し、完了ならポイントを反映する
export default function PointsComplete() {
  const { refreshUser } = useApp();
  const [st, setSt] = useState<State>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const mp = new URLSearchParams(window.location.search).get("mp");
    if (!mp) {
      setError("決済情報が見つかりません");
      return;
    }
    let stop = false;
    let tries = 0;
    const check = async () => {
      try {
        const res = await fetch(`/api/paypay/status?mp=${encodeURIComponent(mp)}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "決済状況を確認できませんでした");
        if (stop) return;
        setSt(data);
        if (data.credited) {
          await refreshUser();
          return;
        }
        // 支払い直後は反映に数秒かかることがあるので、しばらく確認を続ける
        if (data.status === "CREATED" && tries++ < 20) setTimeout(check, 3000);
      } catch (e) {
        if (!stop) setError(e instanceof Error ? e.message : "決済状況を確認できませんでした");
      }
    };
    check();
    return () => {
      stop = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const done = st?.credited;
  const waiting = !error && (!st || st.status === "CREATED");
  const title = error ? "確認できませんでした" : done ? "ポイントを追加しました" : waiting ? "お支払いを確認しています" : "お支払いが完了していません";
  const text = error
    ? error
    : done
      ? `${fmtPt(st!.points)} を追加しました(¥${st!.price.toLocaleString()} PayPay)。`
      : waiting
        ? "PayPayでのお支払いが完了すると、自動でポイントが反映されます。"
        : "お支払いがキャンセルされたか、有効期限が切れました。もう一度お試しください。";

  return (
    <Screen>
      <div className="flex min-h-full flex-col items-center justify-center px-8 py-12 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full border border-line bg-card text-4xl text-gold">
          {done ? "✓" : waiting ? "…" : "!"}
        </div>
        <h1 className="mt-6 font-mincho text-2xl font-bold">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-mute">{text}</p>
        {waiting && !st && <Loading label="確認中" />}
        <div className="mt-9 flex w-full max-w-[280px] flex-col gap-2.5">
          {done || waiting ? (
            <Link href="/home" className={btnGold}>ホームへ戻る</Link>
          ) : (
            <Link href="/points" className={btnGold}>ポイント購入に戻る</Link>
          )}
          {done && <Link href="/tellers" className={btnLine}>先生を探す</Link>}
        </div>
      </div>
    </Screen>
  );
}

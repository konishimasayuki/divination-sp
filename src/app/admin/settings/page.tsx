"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import type { Settings } from "@/lib/types";
import { AdminShell, panel } from "@/components/AdminShell";

type Status = Record<string, boolean>;
const fi = "h-10 w-full rounded-[10px] border border-edge bg-night px-3 text-sm outline-none focus:border-gold";

const SERVICES = [
  { key: "stripe", name: "Stripe", desc: "ポイント購入の決済", envs: ["STRIPE_SECRET_KEY", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"] },
  { key: "agora", name: "Agora", desc: "ビデオ・音声通話", envs: ["NEXT_PUBLIC_AGORA_APP_ID", "AGORA_APP_CERTIFICATE"] },
  { key: "claude", name: "Claude API", desc: "AI手相・AI占い師", envs: ["ANTHROPIC_API_KEY"] },
  { key: "upstash", name: "Upstash", desc: "会員・予約・履歴の保存", envs: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"] },
];

export default function AdminSettings() {
  const { settings, saveSettings } = useApp();
  const [status, setStatus] = useState<Status | null>(null);
  const [f, setF] = useState<Settings | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/env-status").then((r) => r.json()).then(setStatus).catch(() => setStatus({}));
  }, []);

  const v = f ?? settings;
  const setNum = (k: keyof Settings, val: string) => setF({ ...v, [k]: Number(val.replace(/[^\d]/g, "")) || 0 });
  const setPack = (i: number, k: "points" | "price", val: string) =>
    setF({ ...v, packs: v.packs.map((p, j) => (j === i ? { ...p, [k]: Number(val.replace(/[^\d]/g, "")) || 0 } : p)) });

  return (
    <AdminShell title="API・料金設定">
      <div className="mb-3 text-[15px] font-bold">外部サービスの接続状態</div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {SERVICES.map((s) => {
          const ok = status?.[s.key];
          return (
            <div key={s.key} className={`${panel} flex flex-col gap-2.5`}>
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold">{s.name}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] ${status === null ? "bg-deep text-mute" : ok ? "bg-[#1F3A33] text-mint-hi" : "bg-[#3A1C24] text-[#F0A9B4]"}`}>
                  {status === null ? "確認中" : ok ? (s.key === "stripe" && status.stripeTest ? "テストモード" : "接続済み") : "未設定"}
                </span>
              </div>
              <div className="text-xs text-mute">{s.desc}</div>
              {s.envs.map((e) => (
                <span key={e} className="break-all rounded-lg bg-night px-2.5 py-1.5 font-mono text-xs text-lav">{e}</span>
              ))}
            </div>
          );
        })}
      </div>
      <p className="mt-2.5 text-xs text-dim">キーの値はVercelの環境変数で管理し、この画面には表示しません。変更後はVercelで再デプロイしてください。</p>

      <div className="mb-3 mt-7 text-[15px] font-bold">料金・特典の設定</div>
      <div className="grid gap-3.5 xl:grid-cols-2">
        <div className={`${panel} grid grid-cols-2 gap-3`}>
          <label className="flex flex-col gap-1.5 text-xs text-lav">AI手相 1回(pt)<input className={fi} inputMode="numeric" value={v.palmCost} onChange={(e) => setNum("palmCost", e.target.value)} /></label>
          <label className="flex flex-col gap-1.5 text-xs text-lav">会員登録特典(pt)<input className={fi} inputMode="numeric" value={v.signupBonus} onChange={(e) => setNum("signupBonus", e.target.value)} /></label>
          <label className="flex flex-col gap-1.5 text-xs text-lav">通話の無料準備時間(分)<input className={fi} inputMode="numeric" value={v.prepMinutes} onChange={(e) => setNum("prepMinutes", e.target.value)} /></label>
          <label className="flex flex-col gap-1.5 text-xs text-lav">占い師への分配率(%)<input className={fi} inputMode="numeric" value={v.shareRate} onChange={(e) => setNum("shareRate", e.target.value)} /></label>
        </div>
        <div className={`${panel} flex flex-col gap-2.5`}>
          <div className="text-xs text-lav">ポイントパック</div>
          {v.packs.map((p, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_90px] items-center gap-2">
              <input className={fi} inputMode="numeric" aria-label="ポイント" value={p.points} onChange={(e) => setPack(i, "points", e.target.value)} />
              <input className={fi} inputMode="numeric" aria-label="価格(円)" value={p.price} onChange={(e) => setPack(i, "price", e.target.value)} />
              <span className="text-xs text-mint-hi">{p.points > p.price ? `${(p.points - p.price).toLocaleString()}pt おトク` : "—"}</span>
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={() => setF({ ...v, packs: [...v.packs, { points: 10000, price: 9000 }] })} className="text-xs text-gold">+ パックを追加</button>
            {v.packs.length > 1 && <button onClick={() => setF({ ...v, packs: v.packs.slice(0, -1) })} className="text-xs text-rose">最後のパックを削除</button>}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-end gap-2.5">
        {msg && <span className="text-xs text-mint-hi">{msg}</span>}
        <button onClick={() => setF(null)} className="h-11 rounded-[10px] border border-edge px-5 text-sm text-soft">元に戻す</button>
        <button
          onClick={async () => {
            await saveSettings(v);
            setF(null);
            setMsg("保存しました");
          }}
          className="h-11 rounded-[10px] bg-gold px-6 text-sm font-bold text-ink"
        >
          設定を保存
        </button>
      </div>
    </AdminShell>
  );
}

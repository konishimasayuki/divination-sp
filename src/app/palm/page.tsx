"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, useGuard } from "@/lib/store";
import { add, fmtPt } from "@/lib/db";
import type { PalmReading } from "@/lib/types";
import { PALM_LINES, PalmGuide } from "@/components/PalmGuide";
import { IClose, IImage, ISwitch } from "@/components/icons";
import { Loading, Screen } from "@/components/ui";

// 大きな写真は送信前に縮小する
async function shrink(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = url;
  });
  const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * scale);
  c.height = Math.round(img.height * scale);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  return c.toDataURL("image/jpeg", 0.85);
}

export default function Palm() {
  const ok = useGuard("user");
  const router = useRouter();
  const { user, settings, spend } = useApp();
  const camRef = useRef<HTMLInputElement | null>(null);
  const libRef = useRef<HTMLInputElement | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!ok || !user) return <Screen dark><Loading /></Screen>;
  const cost = settings.palmCost;

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setError("");
    setImage(await shrink(f));
  }

  async function run() {
    if (!image || !user) return;
    if (user.points < cost) {
      setError("ポイントが不足しています");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/palm-reading", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "鑑定に失敗しました");
      const paid = await spend(cost, { kind: "palm", label: "AI手相鑑定", detail: "画像鑑定" });
      if (!paid) throw new Error("ポイントが不足しています");
      const rec = await add<PalmReading>("palm", { userId: user.id, result: JSON.stringify(data.result) });
      router.push(`/palm/result/${rec.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "鑑定に失敗しました");
      setBusy(false);
    }
  }

  return (
    <Screen dark nav="palm">
      <div className="flex h-[68px] items-center justify-between px-4">
        <Link href="/home" aria-label="閉じる" className="flex h-11 w-11 items-center justify-center rounded-full bg-card text-text">
          <IClose />
        </Link>
        <span className="font-mincho text-lg font-bold tracking-[0.08em]">AI手相鑑定</span>
        <span className="flex h-[30px] items-center rounded-full border border-gold px-3 text-xs font-bold text-gold">{fmtPt(cost)}</span>
      </div>

      <div className="relative mx-6 mt-1 flex h-[400px] items-center justify-center overflow-hidden rounded-[28px] border border-[#2E2754] bg-[#16112B]">
        {image ? <img src={image} alt="撮影した手のひら" className="absolute inset-0 h-full w-full object-cover" /> : <PalmGuide width={230} />}
        {busy && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[rgba(11,8,24,0.72)]">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold border-t-transparent" />
            <span className="font-mincho text-sm text-lav">手相を読み解いています</span>
          </div>
        )}
        {!image && <div className="absolute inset-x-0 bottom-4 text-center text-[13px] text-lav">手のひらを枠に合わせて撮影してください</div>}
      </div>

      <div className="mx-6 mt-4 grid grid-cols-4 gap-1.5">
        {PALM_LINES.map((l) => (
          <div key={l.key} className="flex flex-col items-center gap-1.5">
            <span className="h-[3px] w-7 rounded" style={{ background: l.color }} />
            <span className="text-[11px] text-lav">{l.label}</span>
          </div>
        ))}
      </div>

      <input ref={camRef} type="file" accept="image/*" capture="environment" onChange={pick} className="hidden" />
      <input ref={libRef} type="file" accept="image/*" onChange={pick} className="hidden" />

      <div className="mt-6 flex flex-col items-center gap-3 px-6 pb-6">
        {image ? (
          <>
            <button onClick={run} disabled={busy} className="flex h-[54px] w-full items-center justify-center rounded-2xl bg-gold text-base font-bold text-ink disabled:opacity-40">
              この手相を占ってもらう({fmtPt(cost)})
            </button>
            <button onClick={() => setImage(null)} disabled={busy} className="h-10 text-sm text-gold">撮り直す</button>
          </>
        ) : (
          <div className="flex items-center justify-center gap-12">
            <button onClick={() => libRef.current?.click()} aria-label="写真から選ぶ" className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-line bg-card text-text">
              <IImage />
            </button>
            <button onClick={() => camRef.current?.click()} aria-label="撮影する" className="flex h-[76px] w-[76px] items-center justify-center rounded-full border-[3px] border-gold">
              <span className="h-[60px] w-[60px] rounded-full bg-gold" />
            </button>
            <button onClick={() => camRef.current?.click()} aria-label="カメラを起動" className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-line bg-card text-text">
              <ISwitch />
            </button>
          </div>
        )}
        {error && <p className="text-center text-xs text-rose">{error}</p>}
        <p className="text-[11px] text-dim">撮影した画像は鑑定後に破棄され、保存されません</p>
      </div>
    </Screen>
  );
}

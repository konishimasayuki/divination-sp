"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";

const STARS = [
  [48, 120, 2, "#D9A04A"], [310, 96, 3, "#F3EEFF"], [250, 180, 2, "#B8AED8"], [90, 250, 3, "#B8AED8"],
  [340, 300, 2, "#D9A04A"], [30, 560, 2, "#F3EEFF"], [350, 610, 3, "#B8AED8"], [170, 140, 2, "#F3EEFF"],
  [280, 680, 2, "#D9A04A"], [70, 700, 3, "#B8AED8"],
] as const;

export default function Splash() {
  const { ready, session } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      if (session?.role === "user") router.replace("/home");
      else if (session?.role === "provider") router.replace("/provider");
      else if (session?.role === "admin") router.replace("/admin");
      else router.replace("/login");
    }, 1400);
    return () => clearTimeout(t);
  }, [ready, session, router]);

  return (
    <div className="relative flex h-[100dvh] flex-col items-center justify-center overflow-hidden bg-abyss">
      {STARS.map(([x, y, s, c], i) => (
        <span key={i} className="absolute rounded-full" style={{ left: `${(x / 390) * 100}%`, top: `${(y / 844) * 100}%`, width: s, height: s, background: c }} />
      ))}
      <img src="/home-icon.png" alt="" className="h-[168px] w-[168px] object-contain" />
      <div className="mt-6 flex flex-col items-center gap-2">
        <span className="pl-[0.3em] font-mincho text-4xl font-bold tracking-[0.3em] text-gold">杉の泉</span>
        <span className="pl-[0.42em] text-[11px] tracking-[0.42em] text-mute">SUGINOIZUMI</span>
      </div>
      <div className="absolute bottom-[120px] flex flex-col items-center gap-3.5">
        <div className="h-0.5 w-[120px] overflow-hidden rounded bg-deep">
          <div className="h-0.5 w-12 animate-[slide_1.4s_ease-in-out_infinite] bg-gold" />
        </div>
        <span className="font-mincho text-[13px] tracking-[0.12em] text-lav">星を読んでいます</span>
      </div>
      <div className="absolute bottom-10 text-[11px] text-faint">オンライン占いサービス</div>
      <style>{`@keyframes slide{0%{transform:translateX(-48px)}100%{transform:translateX(120px)}}`}</style>
    </div>
  );
}

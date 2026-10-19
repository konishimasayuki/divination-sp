"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";

const STARS = [
  [48, 120, 2, "#D9A04A"], [310, 96, 3, "#F3EEFF"], [250, 180, 2, "#B8AED8"], [90, 250, 3, "#B8AED8"],
  [340, 300, 2, "#D9A04A"], [30, 560, 2, "#F3EEFF"], [350, 610, 3, "#B8AED8"], [170, 140, 2, "#F3EEFF"],
  [280, 680, 2, "#D9A04A"], [70, 700, 3, "#B8AED8"],
] as const;

// 流れ星: [開始位置 left%, top%, 遅れ(秒), 長さ(px), 周期(秒)]
const METEORS = [
  [92, 6, 0.15, 150, 3.2],
  [70, 2, 1.1, 110, 3.8],
  [100, 24, 2.0, 130, 4.4],
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
        <span
          key={i}
          className="twinkle absolute rounded-full"
          style={{ left: `${(x / 390) * 100}%`, top: `${(y / 844) * 100}%`, width: s, height: s, background: c, animationDelay: `${(i % 5) * 0.45}s` }}
        />
      ))}
      {METEORS.map(([l, t, d, len, dur], i) => (
        <span key={`m${i}`} aria-hidden className="meteor" style={{ left: `${l}%`, top: `${t}%`, width: len, animationDelay: `${d}s`, animationDuration: `${dur}s` }} />
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
      <style>{`
        @keyframes slide{0%{transform:translateX(-48px)}100%{transform:translateX(120px)}}
        .meteor{position:absolute;height:2px;border-radius:999px;opacity:0;pointer-events:none;
          background:linear-gradient(90deg,rgba(255,244,214,1) 0%,rgba(232,184,102,.85) 12%,rgba(217,160,74,.25) 55%,rgba(217,160,74,0) 100%);
          transform-origin:left center;
          animation-name:meteor;animation-timing-function:cubic-bezier(.35,.1,.6,1);animation-iteration-count:infinite;animation-fill-mode:both}
        .meteor::before{content:"";position:absolute;left:-2px;top:50%;width:5px;height:5px;margin-top:-2.5px;border-radius:50%;
          background:#FFF4D6;box-shadow:0 0 6px 2px rgba(255,236,190,.9),0 0 14px 4px rgba(217,160,74,.55)}
        @keyframes meteor{
          0%{opacity:0;transform:rotate(-35deg) translateX(0) scaleX(.3)}
          6%{opacity:1}
          28%{opacity:1;transform:rotate(-35deg) translateX(-62vmin) scaleX(1)}
          36%,100%{opacity:0;transform:rotate(-35deg) translateX(-78vmin) scaleX(.6)}
        }
        .twinkle{animation:twinkle 2.6s ease-in-out infinite}
        @keyframes twinkle{0%,100%{opacity:1}50%{opacity:.35}}
        @media (prefers-reduced-motion: reduce){.meteor{display:none}.twinkle{animation:none}}
      `}</style>
    </div>
  );
}

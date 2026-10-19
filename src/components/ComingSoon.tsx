"use client";

import Link from "next/link";
import type { FeatureKey } from "@/lib/features";
import { Screen, btnGold } from "./ui";

const COPY: Record<FeatureKey, { name: string; text: string }> = {
  goods: {
    name: "開運グッズ",
    text: "先生方が選んだ開運アイテムをお届けできるよう、ただいま準備を進めています。公開まで今しばらくお待ちください。",
  },
  palm: {
    name: "AI手相",
    text: "手のひらの写真からAIが手相を読み解く鑑定を、ただいま準備しています。公開まで今しばらくお待ちください。",
  },
};

function MoonIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M40 10a22 22 0 1 0 14 34A18 18 0 0 1 40 10Z"
        stroke="#D9A04A"
        strokeWidth="2.2"
        strokeLinejoin="round"
        fill="#D9A04A"
        fillOpacity="0.12"
      />
      <path d="M50 14v6M47 17h6" stroke="#E8B866" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="56" cy="28" r="1.4" fill="#E8B866" />
    </svg>
  );
}

export default function ComingSoon({ feature }: { feature: FeatureKey }) {
  const c = COPY[feature];
  return (
    <Screen nav={feature}>
      <div className="flex min-h-full flex-col items-center justify-center px-8 py-12 text-center">
        <div className="flex h-28 w-28 items-center justify-center rounded-full border border-line bg-card shadow-[0_0_40px_rgba(217,160,74,0.18)]">
          <MoonIcon />
        </div>
        <div className="mt-7 text-[12px] font-bold tracking-[0.35em] text-gold">COMING SOON</div>
        <h1 className="mt-3 font-mincho text-2xl font-bold leading-snug text-text">{c.name}は準備中です</h1>
        <div className="mx-auto mt-4 h-px w-12 bg-gold/60" />
        <p className="mt-4 text-sm leading-relaxed text-mute">{c.text}</p>
        <Link href="/home" className={`${btnGold} mt-9 w-full max-w-[280px]`}>
          ホームへ戻る
        </Link>
      </div>
    </Screen>
  );
}

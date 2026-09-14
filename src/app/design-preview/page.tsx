"use client";

import { useState } from "react";

type ThemeKey = "magazine" | "compact" | "hero" | "grid";

const labels: Record<ThemeKey, { label: string; concept: string }> = {
  magazine: {
    label: "① マガジン型",
    concept:
      "上部に大きな帯バナー、占い師は横スクロールの大判カードで見せる。写真映え・雑誌的なゆったりレイアウト。",
  },
  compact: {
    label: "② コンパクトリスト型",
    concept:
      "情報密度を上げた縦一列リスト。小さめアイコン+右詰めの価格。素早く比較・選定したい人向け。",
  },
  hero: {
    label: "③ シンボル中心型",
    concept:
      "画面上半分を大きなロゴ/シンボルに使い、下に大きな1本のCTA。占い師一覧はカード枠なしのシンプルな行のみ。",
  },
  grid: {
    label: "④ タイル(2列グリッド)型",
    concept:
      "占い師を正方形タイルの2列グリッドで表示。アプリストアのような一覧性、上部に統計チップを横並び表示。",
  },
};

const dummyProviders = [
  { name: "紗希先生", tag: "タロット・恋愛", rating: 4.9, price: "50pt/文字", reviews: "8,420件" },
  { name: "蓮先生", tag: "四柱推命", rating: 4.8, price: "60pt/文字", reviews: "5,310件" },
  { name: "美月先生", tag: "霊感・霊視", rating: 4.7, price: "80pt/文字", reviews: "2,190件" },
];

export default function DesignPreview() {
  const [active, setActive] = useState<ThemeKey>("magazine");

  return (
    <div className="min-h-screen bg-neutral-100 py-6">
      <div className="mx-auto mb-6 flex w-full max-w-sm flex-col gap-2 px-4">
        <p className="text-xs font-medium text-neutral-500">デザイン案を選択(デモ切り替え)</p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(labels) as ThemeKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`rounded-lg border px-3 py-2 text-xs ${
                active === key
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 bg-white text-neutral-600"
              }`}
            >
              {labels[key].label}
            </button>
          ))}
        </div>
        <p className="rounded-lg bg-white p-3 text-xs leading-relaxed text-neutral-500">
          {labels[active].concept}
        </p>
      </div>

      <div className="mx-auto w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-xl">
        {active === "magazine" && <MagazineLayout />}
        {active === "compact" && <CompactLayout />}
        {active === "hero" && <HeroLayout />}
        {active === "grid" && <GridLayout />}
      </div>
    </div>
  );
}

// マガジン型
function MagazineLayout() {
  return (
    <div className="bg-[#faf7f2]">
      <div className="relative h-44 bg-gradient-to-br from-purple-800 via-purple-600 to-amber-500">
        <div className="absolute inset-0 flex flex-col justify-end p-5">
          <p className="text-[10px] tracking-widest text-white/70">SUGINOIZUMI ONLINE</p>
          <h1 className="text-3xl font-bold text-white">杉の泉</h1>
        </div>
      </div>

      <div className="px-5 py-5">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-base font-bold text-neutral-900">今、話せる占い師</h2>
          <span className="text-xs text-neutral-400">すべて見る →</span>
        </div>

        <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
          {dummyProviders.map((p) => (
            <div key={p.name} className="w-40 shrink-0">
              <div className="mb-2 flex h-40 w-40 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-200 to-amber-100 text-3xl">
                🔮
              </div>
              <p className="text-sm font-bold text-neutral-900">{p.name}</p>
              <p className="text-[11px] text-neutral-500">{p.tag}</p>
              <p className="mt-1 text-[11px] font-medium text-purple-700">
                ★{p.rating} ・ {p.price}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-purple-100 bg-white p-4">
          <p className="text-xs text-neutral-500">今月のピックアップ特集</p>
          <p className="mt-1 text-sm font-bold text-neutral-900">
            「復縁」を叶えた先生ランキング
          </p>
        </div>
      </div>
    </div>
  );
}

// コンパクトリスト型
function CompactLayout() {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <h1 className="text-sm font-bold text-neutral-900">杉の泉</h1>
        <span className="text-[11px] text-neutral-500">保有 510pt</span>
      </div>

      <div className="flex gap-2 border-b border-neutral-100 px-4 py-2 text-[11px]">
        {["すべて", "タロット", "四柱推命", "霊視"].map((c, i) => (
          <span
            key={c}
            className={`rounded px-2 py-1 ${
              i === 0 ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-500"
            }`}
          >
            {c}
          </span>
        ))}
      </div>

      <div>
        {dummyProviders.map((p, i) => (
          <div
            key={p.name}
            className={`flex items-center gap-2 px-4 py-2.5 ${
              i !== 0 ? "border-t border-neutral-100" : ""
            }`}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-[10px] font-medium text-white">
              {p.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1">
                <p className="truncate text-xs font-bold text-neutral-900">{p.name}</p>
                <span className="text-[10px] text-neutral-400">★{p.rating}</span>
              </div>
              <p className="truncate text-[10px] text-neutral-400">
                {p.tag} ・ 鑑定{p.reviews}
              </p>
            </div>
            <span className="shrink-0 text-[11px] font-bold text-neutral-900">{p.price}</span>
          </div>
        ))}
      </div>

      <div className="p-3">
        <button className="w-full rounded bg-neutral-900 py-2 text-xs font-medium text-white">
          もっと見る
        </button>
      </div>
    </div>
  );
}

// シンボル中心型
function HeroLayout() {
  return (
    <div className="flex flex-col bg-gradient-to-b from-[#1a1030] to-[#0d0818] text-white">
      <div className="flex flex-col items-center px-6 pb-6 pt-14">
        <div className="mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-amber-200 text-5xl shadow-[0_0_60px_rgba(168,85,247,0.5)]">
          🔮
        </div>
        <h1 className="text-3xl font-bold tracking-wide">杉の泉</h1>
        <p className="mt-1 text-xs text-white/50">運命を、あなたの味方に</p>

        <button className="mt-8 w-full rounded-full bg-white py-4 text-sm font-bold text-[#1a1030]">
          今すぐ占ってもらう
        </button>
      </div>

      <div className="rounded-t-[32px] bg-[#120c22] px-6 py-6">
        <p className="mb-3 text-[11px] uppercase tracking-widest text-white/40">
          Fortune Tellers
        </p>
        {dummyProviders.map((p, i) => (
          <div
            key={p.name}
            className={`flex items-center justify-between py-3 ${
              i !== 0 ? "border-t border-white/10" : ""
            }`}
          >
            <div>
              <p className="text-sm font-medium">{p.name}</p>
              <p className="text-[11px] text-white/40">{p.tag}</p>
            </div>
            <p className="text-xs text-white/60">{p.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// タイル(2列グリッド)型
function GridLayout() {
  return (
    <div>
      <div className="bg-neutral-900 px-5 pb-5 pt-6 text-white">
        <h1 className="text-lg font-bold">杉の泉</h1>
        <div className="mt-3 flex gap-2">
          <div className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-center">
            <p className="text-[10px] text-white/50">保有pt</p>
            <p className="text-sm font-bold">510</p>
          </div>
          <div className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-center">
            <p className="text-[10px] text-white/50">在籍占い師</p>
            <p className="text-sm font-bold">3</p>
          </div>
          <div className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-center">
            <p className="text-[10px] text-white/50">対応可能</p>
            <p className="text-sm font-bold">1</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4">
        {dummyProviders.map((p) => (
          <div key={p.name} className="overflow-hidden rounded-xl border border-neutral-200">
            <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300 text-3xl">
              🔮
            </div>
            <div className="p-2">
              <p className="truncate text-xs font-bold text-neutral-900">{p.name}</p>
              <p className="truncate text-[10px] text-neutral-500">{p.tag}</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[10px] text-neutral-400">★{p.rating}</span>
                <span className="text-[10px] font-bold text-neutral-900">{p.price}</span>
              </div>
            </div>
          </div>
        ))}
        <div className="flex aspect-[1/1.3] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 text-xs text-neutral-400">
          もっと見る →
        </div>
      </div>
    </div>
  );
}

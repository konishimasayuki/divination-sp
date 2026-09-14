"use client";

import { useState } from "react";

type ThemeKey = "elegant" | "neon" | "pastel" | "wamodern";

const themes: Record<
  ThemeKey,
  {
    label: string;
    concept: string;
    fontImport: string;
    fontClass: string;
    pageBg: string;
    cardBg: string;
    cardBorder: string;
    primaryBtn: string;
    accentText: string;
    subText: string;
    chipBg: string;
    logoBg: string;
    radius: string;
    heading: string;
  }
> = {
  elegant: {
    label: "① エレガント紫×ゴールド",
    concept: "上品・落ち着き。今の路線を洗練させた方向性。ゴールドの差し色で高級感を出す。",
    fontImport:
      "https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700&family=Noto+Sans+JP:wght@400;500&display=swap",
    fontClass: "font-[Noto_Sans_JP]",
    pageBg: "bg-gradient-to-b from-[#f6f0fb] to-white",
    cardBg: "bg-white",
    cardBorder: "border border-[#e6dcf3]",
    primaryBtn: "bg-[#5b3a8e] text-white",
    accentText: "text-[#5b3a8e]",
    subText: "text-[#a98fce]",
    chipBg: "bg-[#f1e9fa] text-[#5b3a8e]",
    logoBg: "bg-gradient-to-br from-[#5b3a8e] to-[#a98fce]",
    radius: "rounded-2xl",
    heading: "font-[Shippori_Mincho]",
  },
  neon: {
    label: "② ダーク神秘×ネオン",
    concept: "夜・宇宙・スピリチュアル感。占い感の強い没入型。若年層・SNS映え重視の方向性。",
    fontImport:
      "https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Noto+Sans+JP:wght@400;500&display=swap",
    fontClass: "font-[Noto_Sans_JP]",
    pageBg: "bg-[#0b0714]",
    cardBg: "bg-[#150e26]",
    cardBorder: "border border-[#3a2a5c]",
    primaryBtn: "bg-gradient-to-r from-[#a855f7] to-[#ec4899] text-white",
    accentText: "text-[#d8b4fe]",
    subText: "text-[#8b7bab]",
    chipBg: "bg-[#2a1f47] text-[#d8b4fe]",
    logoBg: "bg-gradient-to-br from-[#a855f7] to-[#ec4899]",
    radius: "rounded-xl",
    heading: "font-[Cinzel]",
  },
  pastel: {
    label: "③ パステルピンクのかわいい系",
    concept: "親しみやすく明るい。初心者・若い女性層に刺さる、ゆるく可愛いトーン。",
    fontImport:
      "https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700&display=swap",
    fontClass: "font-[Zen_Maru_Gothic]",
    pageBg: "bg-gradient-to-b from-[#fff0f6] to-[#fff9fb]",
    cardBg: "bg-white",
    cardBorder: "border-2 border-[#ffd6e8]",
    primaryBtn: "bg-[#ff8fb3] text-white",
    accentText: "text-[#ff6f9c]",
    subText: "text-[#ffb3cc]",
    chipBg: "bg-[#ffe4ef] text-[#ff6f9c]",
    logoBg: "bg-gradient-to-br from-[#ff8fb3] to-[#ffc2d9]",
    radius: "rounded-[28px]",
    heading: "font-[Zen_Maru_Gothic]",
  },
  wamodern: {
    label: "④ ネイビー×ゴールドの和モダン",
    concept: "大人向け・信頼感重視。老舗感・格式のある占い所のイメージ。",
    fontImport:
      "https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@500;700&family=Noto+Sans+JP:wght@400;500&display=swap",
    fontClass: "font-[Noto_Sans_JP]",
    pageBg: "bg-[#0f1a2e]",
    cardBg: "bg-[#16233b]",
    cardBorder: "border border-[#c9a86a]/30",
    primaryBtn: "bg-[#c9a86a] text-[#0f1a2e]",
    accentText: "text-[#c9a86a]",
    subText: "text-[#6f7f9c]",
    chipBg: "bg-[#c9a86a]/15 text-[#c9a86a]",
    logoBg: "bg-gradient-to-br from-[#c9a86a] to-[#8a6f3a]",
    radius: "rounded-lg",
    heading: "font-[Noto_Serif_JP]",
  },
};

const dummyProviders = [
  { name: "紗希先生", tag: "タロット・恋愛", rating: 4.9, price: "50pt/文字" },
  { name: "蓮先生", tag: "四柱推命", rating: 4.8, price: "60pt/文字" },
  { name: "美月先生", tag: "霊感・霊視", rating: 4.7, price: "80pt/文字" },
];

export default function DesignPreview() {
  const [active, setActive] = useState<ThemeKey>("elegant");
  const t = themes[active];
  const isDark = active === "neon" || active === "wamodern";

  return (
    <div className="min-h-screen bg-neutral-100 py-6">
      <link rel="stylesheet" href={t.fontImport} />

      {/* 切り替えセレクター */}
      <div className="mx-auto mb-6 flex w-full max-w-sm flex-col gap-2 px-4">
        <p className="text-xs font-medium text-neutral-500">デザイン案を選択(デモ切り替え)</p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(themes) as ThemeKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`rounded-lg border px-3 py-2 text-xs ${
                active === key
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 bg-white text-neutral-600"
              }`}
            >
              {themes[key].label}
            </button>
          ))}
        </div>
        <p className="rounded-lg bg-white p-3 text-xs leading-relaxed text-neutral-500">
          {t.concept}
        </p>
      </div>

      {/* プレビュー本体 */}
      <div
        className={`mx-auto w-full max-w-sm overflow-hidden rounded-3xl shadow-xl ${t.pageBg} ${t.fontClass}`}
      >
        {/* ログイン画面プレビュー */}
        <div className="flex flex-col items-center px-6 pb-8 pt-10">
          <div
            className={`mb-3 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl ${t.logoBg}`}
          >
            🔮
          </div>
          <h1 className={`text-2xl font-bold tracking-wide ${t.accentText} ${t.heading}`}>
            杉の泉
          </h1>
          <p className={`mt-1 text-xs ${t.subText}`}>運命を、あなたの味方に</p>

          <div className={`mt-6 flex w-full flex-col gap-2 p-4 ${t.cardBg} ${t.cardBorder} ${t.radius}`}>
            <div
              className={`rounded border px-2 py-2 text-xs ${
                isDark ? "border-white/10 text-white/40" : "border-neutral-200 text-neutral-400"
              }`}
            >
              name@example.com
            </div>
            <div
              className={`rounded border px-2 py-2 text-xs ${
                isDark ? "border-white/10 text-white/40" : "border-neutral-200 text-neutral-400"
              }`}
            >
              ••••••••
            </div>
            <button className={`mt-1 rounded-lg py-2.5 text-sm font-medium ${t.primaryBtn}`}>
              ログイン
            </button>
          </div>
          <p className={`mt-3 text-xs underline ${t.accentText}`}>はじめての方はこちら(会員登録)</p>
        </div>

        <div className={`h-px w-full ${isDark ? "bg-white/10" : "bg-neutral-200"}`} />

        {/* ホーム画面プレビュー */}
        <div className="flex flex-col gap-3 px-4 py-6">
          <div className="flex items-center justify-between">
            <h2 className={`text-sm font-bold ${isDark ? "text-white" : "text-neutral-900"} ${t.heading}`}>
              占い師一覧
            </h2>
            <span className={`text-xs ${t.subText}`}>保有 510pt</span>
          </div>

          {dummyProviders.map((p) => (
            <div
              key={p.name}
              className={`flex items-center gap-3 p-3 ${t.cardBg} ${t.cardBorder} ${t.radius}`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center text-sm font-medium ${t.radius} ${t.chipBg}`}
              >
                {p.name[0]}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${isDark ? "text-white" : "text-neutral-900"}`}>
                  {p.name}
                </p>
                <p className={`text-xs ${t.subText}`}>
                  {p.tag} ★{p.rating}
                </p>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs ${t.chipBg}`}>{p.price}</span>
            </div>
          ))}

          <button className={`mt-1 rounded-lg py-2.5 text-sm font-medium ${t.primaryBtn}`}>
            さっそく占ってみる
          </button>
        </div>
      </div>
    </div>
  );
}

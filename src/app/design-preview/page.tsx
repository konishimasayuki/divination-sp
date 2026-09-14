"use client";

import { useState } from "react";

type ScreenKey = "login" | "home" | "detail" | "mypage";

const screens: Record<ScreenKey, string> = {
  login: "ログイン",
  home: "ホーム",
  detail: "占い師詳細",
  mypage: "マイページ",
};

const dummyProviders = [
  { name: "紗希先生", tag: "タロット・恋愛", rating: 4.9, price: "50pt/文字", reviews: "8,420", tags: ["ゆったり", "初心者歓迎", "寄り添い"] },
  { name: "蓮先生", tag: "四柱推命", rating: 4.8, price: "60pt/文字", reviews: "5,310", tags: ["具体的", "テンポが良い"] },
  { name: "美月先生", tag: "霊感・霊視", rating: 4.7, price: "80pt/文字", reviews: "2,190", tags: ["本格派", "リピーター多数"] },
];

export default function DesignPreview() {
  const [screen, setScreen] = useState<ScreenKey>("home");

  return (
    <div className="min-h-screen bg-neutral-100 py-6">
      <div className="mx-auto mb-6 flex w-full max-w-sm flex-col gap-2 px-4">
        <p className="text-xs font-medium text-neutral-500">マガジン型・深掘り版(画面切り替え)</p>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(screens) as ScreenKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setScreen(key)}
              className={`rounded-lg border px-2 py-2 text-xs ${
                screen === key
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 bg-white text-neutral-600"
              }`}
            >
              {screens[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-sm overflow-hidden rounded-3xl bg-[#faf7f2] shadow-xl">
        {screen === "login" && <LoginScreen />}
        {screen === "home" && <HomeScreen />}
        {screen === "detail" && <DetailScreen />}
        {screen === "mypage" && <MypageScreen />}
      </div>
    </div>
  );
}

// 共通の帯バナー(見出し)
function Hero({ small = false }: { small?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-purple-800 via-purple-600 to-amber-500 ${
        small ? "h-24" : "h-52"
      }`}
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-10 left-10 h-24 w-24 rounded-full bg-white/10" />
      <div className={`relative flex h-full flex-col justify-end p-5 ${small ? "pb-4" : ""}`}>
        <p className="text-[10px] tracking-[0.2em] text-white/70">SUGINOIZUMI ONLINE</p>
        <h1 className={`font-bold text-white ${small ? "text-xl" : "text-4xl"}`}>杉の泉</h1>
        {!small && <p className="mt-1 text-xs text-white/70">運命を、あなたの味方に</p>}
      </div>
    </div>
  );
}

// ログイン画面(マガジン版)
function LoginScreen() {
  return (
    <div>
      <Hero />
      <div className="px-6 py-6">
        <div className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-medium text-neutral-500">ログイン</p>
          <div className="flex flex-col gap-2">
            <div className="rounded-lg border border-neutral-200 px-3 py-2.5 text-xs text-neutral-400">
              name@example.com
            </div>
            <div className="rounded-lg border border-neutral-200 px-3 py-2.5 text-xs text-neutral-400">
              ••••••••
            </div>
            <button className="mt-1 rounded-lg bg-gradient-to-r from-purple-700 to-purple-500 py-3 text-sm font-bold text-white shadow-sm">
              ログイン
            </button>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-purple-700 underline">
          はじめての方はこちら(会員登録)
        </p>

        <div className="mt-8 flex items-center gap-3 text-center">
          <div className="h-px flex-1 bg-neutral-200" />
          <p className="text-[10px] text-neutral-400">今月の特集</p>
          <div className="h-px flex-1 bg-neutral-200" />
        </div>
        <div className="mt-3 rounded-2xl bg-gradient-to-r from-amber-100 to-purple-100 p-4">
          <p className="text-xs font-bold text-neutral-800">初回登録で 500pt プレゼント</p>
          <p className="mt-1 text-[11px] text-neutral-500">
            会員登録するとすぐに鑑定をお試しいただけます
          </p>
        </div>
      </div>
    </div>
  );
}

// ホーム画面(マガジン版)
function HomeScreen() {
  return (
    <div>
      <Hero small />

      <div className="px-5 py-5">
        <div className="mb-5 flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm">
          <div>
            <p className="text-[10px] text-neutral-400">保有ポイント</p>
            <p className="text-lg font-bold text-neutral-900">510pt</p>
          </div>
          <button className="rounded-full bg-purple-700 px-4 py-2 text-xs font-bold text-white">
            購入する
          </button>
        </div>

        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-base font-bold text-neutral-900">今、話せる占い師</h2>
          <span className="text-xs text-neutral-400">すべて見る →</span>
        </div>

        <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-3">
          {dummyProviders.map((p, i) => (
            <div key={p.name} className="w-44 shrink-0">
              <div className="relative mb-2 h-44 w-44 overflow-hidden rounded-2xl bg-gradient-to-br from-purple-200 via-purple-100 to-amber-100">
                <div className="flex h-full items-center justify-center text-4xl">🔮</div>
                {i === 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-bold text-white">
                    殿堂入り
                  </span>
                )}
                <span className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[9px] text-white">
                  {p.price}
                </span>
              </div>
              <p className="text-sm font-bold text-neutral-900">{p.name}</p>
              <p className="text-[11px] text-neutral-500">{p.tag}</p>
              <p className="mt-0.5 text-[11px] font-medium text-purple-700">
                ★{p.rating}(鑑定{p.reviews}件)
              </p>
            </div>
          ))}
        </div>

        <div className="mt-2 overflow-hidden rounded-2xl border border-purple-100 bg-white">
          <div className="bg-gradient-to-r from-purple-700 to-purple-500 px-4 py-2">
            <p className="text-xs font-bold text-white">今月のピックアップ特集</p>
          </div>
          <div className="p-4">
            <p className="text-sm font-bold text-neutral-900">「復縁」を叶えた先生ランキング</p>
            <p className="mt-1 text-[11px] text-neutral-500">
              諦めかけた恋を取り戻した方続出。今だけの特集ページを公開中。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 占い師詳細画面(マガジン版)
function DetailScreen() {
  const p = dummyProviders[0];
  return (
    <div>
      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-purple-800 via-purple-500 to-amber-400">
        <div className="flex h-full items-center justify-center text-6xl">🔮</div>
        <button className="absolute left-4 top-4 rounded-full bg-white/80 px-3 py-1 text-xs">
          ← 戻る
        </button>
        <button className="absolute right-4 top-4 rounded-full bg-white/80 px-3 py-1.5 text-sm">
          🤍
        </button>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5 pt-10">
          <h1 className="text-2xl font-bold text-white">{p.name}</h1>
          <p className="text-xs text-white/80">{p.tag}</p>
        </div>
      </div>

      <div className="px-5 py-5">
        <div className="flex items-center gap-4 text-sm">
          <span className="font-bold text-neutral-900">★ {p.rating}</span>
          <span className="text-neutral-500">鑑定数 {p.reviews}件</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {p.tags.map((t) => (
            <span key={t} className="rounded-full bg-purple-50 px-3 py-1 text-xs text-purple-700">
              {t}
            </span>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-purple-100 bg-white p-4">
          <p className="mb-1 text-xs font-bold text-neutral-900">{p.tag}鑑定歴 8年</p>
          <p className="text-xs leading-relaxed text-neutral-600">
            タロット鑑定歴8年。恋愛・復縁・片想いを中心に、あなたの気持ちに寄り添いながら丁寧にお伝えします。焦らずゆっくりお話ししましょう。
          </p>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-bold text-neutral-900">感謝の声</p>
          <div className="rounded-xl bg-white p-3 text-xs">
            <p className="font-medium text-neutral-800">30代 女性 ★★★★★</p>
            <p className="mt-1 text-neutral-500">
              いつも的確なアドバイスをありがとうございます。安心してお話しできました。
            </p>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 flex gap-2 border-t border-purple-100 bg-white/95 p-3 backdrop-blur">
        <button className="flex-1 rounded-xl bg-purple-700 py-3 text-center text-xs font-bold text-white">
          チャット
          <br />
          <span className="font-normal text-white/80">50pt / 1文字</span>
        </button>
        <button className="flex-1 rounded-xl bg-neutral-900 py-3 text-center text-xs font-bold text-white">
          電話
          <br />
          <span className="font-normal text-white/70">120pt / 1分</span>
        </button>
      </div>
    </div>
  );
}

// マイページ(マガジン版)
function MypageScreen() {
  return (
    <div>
      <Hero small />
      <div className="px-5 py-5">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-200 to-amber-100 text-xl font-bold text-purple-700">
              花
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900">占い 花子 様</p>
              <p className="text-xs text-neutral-400">hanako@example.com</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-purple-50 to-amber-50 px-4 py-3">
            <div>
              <p className="text-[10px] text-neutral-500">保有ポイント</p>
              <p className="text-xl font-bold text-neutral-900">510pt</p>
            </div>
            <button className="rounded-full bg-purple-700 px-4 py-2 text-xs font-bold text-white">
              購入する
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm">
          {["予約・利用履歴", "占いグッズ", "登録情報の編集", "利用規約"].map((label, i) => (
            <div
              key={label}
              className={`flex items-center justify-between px-4 py-3 text-sm ${
                i !== 0 ? "border-t border-neutral-100" : ""
              }`}
            >
              <span className="text-neutral-800">{label}</span>
              <span className="text-neutral-300">›</span>
            </div>
          ))}
        </div>

        <button className="mt-4 w-full rounded-xl border border-neutral-200 py-2.5 text-xs text-neutral-500">
          ログアウト
        </button>
      </div>
    </div>
  );
}

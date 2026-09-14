"use client";

import { useState } from "react";

type Provider = {
  id: string;
  name: string;
  tag: string;
  rating: number;
  status: "available" | "busy" | "off";
  chatRate: number; // 1文字あたりのポイント
  callRate: number; // 1分あたりのポイント
  mailRate: number; // 1回あたりのポイント
  reviewCount: number;
  styleTags: string[];
  bio: string;
};

type Course = {
  id: string;
  label: string;
  minutes: number;
  points: number;
};

type PointPack = {
  id: string;
  points: number;
  price: number;
};

type HistoryItem = {
  id: string;
  label: string;
  detail: string;
  points: number; // 消費はマイナス、購入はプラス
  date: string;
};

type Product = {
  id: string;
  name: string;
  category: string;
  points: number;
  desc: string;
};

type ChatMsg = {
  from: "user" | "provider";
  text: string;
};

type CartLine = {
  productId: string;
  qty: number;
};

type Tab = "home" | "shop" | "history" | "messages" | "mypage";
type MainStep = "providers" | "detail" | "booking" | "checkout" | "call" | "chat";
type MypageView = "top" | "edit" | "purchase" | "terms";
type ShopView = "list" | "cart";

const initialProviders: Provider[] = [
  {
    id: "p1",
    name: "紗希先生(デモ)",
    tag: "タロット・恋愛",
    rating: 4.9,
    status: "available",
    chatRate: 50,
    callRate: 120,
    mailRate: 3000,
    reviewCount: 8420,
    styleTags: ["ゆったり", "初心者歓迎", "寄り添い"],
    bio: "タロット鑑定歴8年。恋愛・復縁・片想いを中心に、あなたの気持ちに寄り添いながら丁寧にお伝えします。焦らずゆっくりお話ししましょう。",
  },
  {
    id: "p2",
    name: "蓮先生(デモ)",
    tag: "四柱推命",
    rating: 4.8,
    status: "busy",
    chatRate: 60,
    callRate: 150,
    mailRate: 4000,
    reviewCount: 5310,
    styleTags: ["具体的", "テンポが良い", "的確"],
    bio: "四柱推命歴12年。仕事運・金運の的中率に定評あり。結論から端的にお伝えするスタイルです。",
  },
  {
    id: "p3",
    name: "美月先生(デモ)",
    tag: "霊感・霊視",
    rating: 4.7,
    status: "off",
    chatRate: 80,
    callRate: 200,
    mailRate: 5000,
    reviewCount: 2190,
    styleTags: ["スピリチュアル", "本格派", "リピーター多数"],
    bio: "霊視歴15年。目に見えないご縁や因縁、相手の本音を視ていきます。深い悩みほどお力になれます。",
  },
];

const courses: Course[] = [
  { id: "c1", label: "15分コース", minutes: 15, points: 1500 },
  { id: "c2", label: "30分コース", minutes: 30, points: 2800 },
];

const times = ["今日 20:00", "今日 21:00", "明日 19:00", "明日 20:30"];

const pointPacks: PointPack[] = [
  { id: "pp1", points: 1000, price: 1000 },
  { id: "pp2", points: 3000, price: 2800 },
  { id: "pp3", points: 5000, price: 4500 },
];

const products: Product[] = [
  {
    id: "pr1",
    name: "アメジスト浄化ブレスレット",
    category: "水晶",
    points: 3200,
    desc: "浄化・魔除けの意味を持つ紫水晶のブレスレット",
  },
  {
    id: "pr2",
    name: "ローズクォーツブレスレット",
    category: "水晶",
    points: 2800,
    desc: "恋愛運アップの定番、淡いピンクの天然石",
  },
  {
    id: "pr3",
    name: "水晶(クリアクォーツ)さざれ石",
    category: "水晶",
    points: 1500,
    desc: "浄化用のさざれ石。他の石の浄化にも使える",
  },
  {
    id: "pr4",
    name: "本連 数珠(女性用)",
    category: "数珠",
    points: 4500,
    desc: "法事・お参り用の正式な本連数珠",
  },
  {
    id: "pr5",
    name: "略式数珠(男女兼用)",
    category: "数珠",
    points: 2200,
    desc: "普段使いしやすいシンプルな略式数珠",
  },
  {
    id: "pr6",
    name: "先生監修タロットカード",
    category: "タロット",
    points: 3800,
    desc: "紗希先生が実際に使用している78枚デッキと同モデル",
  },
];

const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

const statusLabel: Record<Provider["status"], string> = {
  available: "対応可能",
  busy: "鑑定中",
  off: "休止中",
};

const statusStyle: Record<Provider["status"], string> = {
  available: "bg-emerald-100 text-emerald-700",
  busy: "bg-amber-100 text-amber-700",
  off: "bg-gray-100 text-gray-500",
};

export default function Home() {
  // 占い師データ(管理者・占い師モードから編集可能)
  // 占い師データ(管理者・占い師モードから編集可能)
  const [providerList, setProviderList] = useState<Provider[]>(initialProviders);
  const [adminView, setAdminView] = useState<
    "overview" | "providers" | "history" | "settings"
  >("overview");
  const [stripePubKey, setStripePubKey] = useState("");
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [stripeSaved, setStripeSaved] = useState(false);
  const loggedInProviderId = "p1"; // デモ: 占い師ログイン時は紗希先生として扱う

  function updateProviderStatus(id: string, status: Provider["status"]) {
    setProviderList((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }

  // 登録状態
  const [registered, setRegistered] = useState(false);
  const [authStep, setAuthStep] = useState<"login" | "register" | "app" | "admin" | "provider">(
    "login"
  );
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");

  // ナビゲーション
  const [tab, setTab] = useState<Tab>("home");
  const [mypageView, setMypageView] = useState<MypageView>("top");
  const [step, setStep] = useState<MainStep>("providers");
  const [shopView, setShopView] = useState<ShopView>("list");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [shopMessage, setShopMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailTab, setDetailTab] = useState<"profile" | "reviews">("profile");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchMode, setSearchMode] = useState<"category" | "name">("category");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [consultMethod, setConsultMethod] = useState<"chat" | "call" | "mail">("chat");
  const [searchSubmitted, setSearchSubmitted] = useState(false);
  const [legalDoc, setLegalDoc] = useState<"terms" | "privacy" | "tokushoho">("terms");

  // 予約フロー
  const [provider, setProvider] = useState<Provider | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [time, setTime] = useState<string | null>(null);

  // ポイント・履歴
  const [points, setPoints] = useState(800);
  const [history, setHistory] = useState<HistoryItem[]>([
    { id: "h1", label: "初回登録特典", detail: "新規登録ボーナス", points: 800, date: "9/1" },
  ]);

  // チャット占い
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);

  // 通話画面
  const [preCall, setPreCall] = useState(true);
  const [chat, setChat] = useState<string[]>(["お客様: このカードの意味は?"]);
  const [message, setMessage] = useState("");
  const [cameraOn, setCameraOn] = useState(true);

  function handleLogin() {
    setLoginError("");
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError("メールアドレスとパスワードを入力してください");
      return;
    }
    if (loginEmail === "z" && loginPassword === "z") {
      setAuthStep("admin");
      return;
    }
    if (loginEmail === "b" && loginPassword === "b") {
      setAuthStep("provider");
      return;
    }
    if (loginEmail === "a" && loginPassword === "a") {
      if (!registered) {
        setName("占い 花子");
        setBirthday("1992-05-14");
        setGender("female");
        setEmail("hanako@example.com");
        setRegistered(true);
      }
      setAuthStep("app");
      return;
    }
    setLoginError("ログイン情報が正しくありません");
  }

  function submitRegistration() {
    if (!name.trim() || !birthday || !gender || !email.trim()) {
      setFormError("すべての項目を入力してください");
      return;
    }
    setFormError("");
    setRegistered(true);
    setAuthStep("app");
  }

  function startChat(p: Provider) {
    if (p.status === "off") return;
    setProvider(p);
    setChatMsgs([
      { from: "provider", text: `こんにちは、${p.name}です。何でも聞いてくださいね。` },
    ]);
    setStep("chat");
  }

  function sendChatMessage() {
    if (!chatInput.trim() || !provider) return;
    if (points < provider.chatRate) {
      setChatMsgs((prev) => [
        ...prev,
        { from: "provider", text: "ポイントが不足しています。マイページから購入してください。" },
      ]);
      return;
    }
    const text = chatInput.trim();
    setChatInput("");
    setChatMsgs((prev) => [...prev, { from: "user", text }]);
    setPoints((prev) => prev - provider.chatRate);
    setHistory((prev) => [
      {
        id: `h${prev.length + 1}`,
        label: `${provider.name} チャット占い`,
        detail: text.slice(0, 20),
        points: -provider.chatRate,
        date: "本日",
      },
      ...prev,
    ]);
    setChatSending(true);
    setTimeout(() => {
      setChatMsgs((prev) => [
        ...prev,
        { from: "provider", text: "なるほど、そのことについて詳しく見てみますね。" },
      ]);
      setChatSending(false);
    }, 1200);
  }

  function toggleTag(t: string) {
    setSelectedTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  function viewDetail(p: Provider) {
    setProvider(p);
    setDetailTab("profile");
    setStep("detail");
    setTab("home");
  }

  function toggleFavorite(id: string) {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }

  function selectProvider(p: Provider) {
    if (p.status !== "available") return;
    setProvider(p);
    setStep("booking");
  }

  function confirmBooking() {
    if (!course || !time) return;
    setStep("checkout");
  }

  function pay() {
    if (!course || !provider) return;
    if (course.points > points) {
      setMypageView("purchase");
      setTab("mypage");
      return;
    }
    setPoints((prev) => prev - course.points);
    setHistory((prev) => [
      {
        id: `h${prev.length + 1}`,
        label: `${provider.name} / ${course.label}`,
        detail: time ?? "",
        points: -course.points,
        date: "本日",
      },
      ...prev,
    ]);
    setStep("call");
    setPreCall(true);
    setTimeout(() => setPreCall(false), 3000);
  }

  function sendMessage() {
    if (!message.trim()) return;
    setChat((prev) => [...prev, `お客様: ${message}`]);
    setMessage("");
  }

  function sendGift(amount: number) {
    if (points < amount || !provider) return;
    setPoints((prev) => prev - amount);
    setChat((prev) => [...prev, `投げ銭 ${amount}pt を送りました`]);
    setHistory((prev) => [
      {
        id: `h${prev.length + 1}`,
        label: `${provider.name} へ投げ銭`,
        detail: "通話中",
        points: -amount,
        date: "本日",
      },
      ...prev,
    ]);
  }

  function cartTotal() {
    return cart.reduce((sum, line) => sum + productMap[line.productId].points * line.qty, 0);
  }

  function addToCart(productId: string) {
    setShopMessage("");
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === productId);
      if (existing) {
        return prev.map((l) =>
          l.productId === productId ? { ...l, qty: l.qty + 1 } : l
        );
      }
      return [...prev, { productId, qty: 1 }];
    });
  }

  function changeQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.productId === productId ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0)
    );
  }

  function checkoutCart() {
    const total = cartTotal();
    if (cart.length === 0) return;
    if (total > points) {
      setShopMessage("ポイントが不足しています。マイページから購入してください。");
      return;
    }
    setPoints((prev) => prev - total);
    const label = cart
      .map((l) => `${productMap[l.productId].name} x${l.qty}`)
      .join(" / ");
    setHistory((prev) => [
      {
        id: `h${prev.length + 1}`,
        label: "物販購入",
        detail: label,
        points: -total,
        date: "本日",
      },
      ...prev,
    ]);
    setCart([]);
    setShopMessage("購入が完了しました");
    setShopView("list");
  }

  function buyPack(pack: PointPack) {
    setPoints((prev) => prev + pack.points);
    setHistory((prev) => [
      {
        id: `h${prev.length + 1}`,
        label: `${pack.points}ptパック購入`,
        detail: `¥${pack.price.toLocaleString()}(ダミー決済)`,
        points: pack.points,
        date: "本日",
      },
      ...prev,
    ]);
    setMypageView("top");
  }

  // ---------- ログイン画面 ----------
  if (authStep === "login") {
    return (
      <div className="min-h-screen bg-[#faf7f2] flex justify-center px-0 sm:px-4 sm:py-10">
        <div className="w-full max-w-sm overflow-hidden bg-[#faf7f2] sm:rounded-3xl sm:shadow-xl">
          <div className="relative h-52 overflow-hidden bg-gradient-to-br from-purple-800 via-purple-600 to-amber-500">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-10 left-10 h-24 w-24 rounded-full bg-white/10" />
            <div className="relative flex h-full flex-col justify-end p-5">
              <p className="text-[10px] tracking-[0.2em] text-white/70">SUGINOIZUMI ONLINE</p>
              <h1 className="text-4xl font-bold text-white">杉の泉</h1>
              <p className="mt-1 text-xs text-white/70">運命を、あなたの味方に</p>
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-medium text-neutral-500">ログイン</p>
              <div className="flex flex-col gap-2">
                <input
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="rounded-lg border border-neutral-200 px-3 py-2.5 text-sm"
                />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-lg border border-neutral-200 px-3 py-2.5 text-sm"
                />
                {loginError && <p className="text-xs text-red-600">{loginError}</p>}
                <button
                  onClick={handleLogin}
                  className="mt-1 rounded-lg bg-gradient-to-r from-purple-700 to-purple-500 py-3 text-sm font-bold text-white shadow-sm"
                >
                  ログイン
                </button>
              </div>
            </div>
            <button
              onClick={() => setAuthStep("register")}
              className="mt-4 w-full text-center text-xs text-purple-700 underline"
            >
              はじめての方はこちら(会員登録)
            </button>

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
      </div>
    );
  }

  // ---------- 管理者モード(デモ) ----------
  if (authStep === "admin") {
    const totalSales = history
      .filter((h) => h.points < 0)
      .reduce((sum, h) => sum + Math.abs(h.points), 0);
    const totalCharged = history
      .filter((h) => h.points > 0)
      .reduce((sum, h) => sum + h.points, 0);

    return (
      <div className="min-h-screen bg-neutral-50 flex justify-center pb-20 pt-8 px-4">
        <div className="w-full max-w-sm">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-lg font-medium">管理者モード</h1>
            <button onClick={() => setAuthStep("login")} className="text-xs text-neutral-500">
              ログアウト
            </button>
          </div>

          {adminView === "overview" && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-neutral-200 bg-white p-3">
                  <p className="text-xs text-neutral-500">ポイント消費額(累計)</p>
                  <p className="mt-1 text-lg font-medium">{totalSales.toLocaleString()}pt</p>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-white p-3">
                  <p className="text-xs text-neutral-500">ポイント購入額(累計)</p>
                  <p className="mt-1 text-lg font-medium">{totalCharged.toLocaleString()}pt</p>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-white p-3">
                  <p className="text-xs text-neutral-500">登録占い師数</p>
                  <p className="mt-1 text-lg font-medium">{providerList.length}名</p>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-white p-3">
                  <p className="text-xs text-neutral-500">対応可能な占い師</p>
                  <p className="mt-1 text-lg font-medium">
                    {providerList.filter((p) => p.status === "available").length}名
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-white p-3">
                <p className="mb-2 text-xs font-medium text-neutral-600">占い師の稼働状況</p>
                <div className="flex flex-col gap-2">
                  {providerList.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-xs">
                      <span>{p.name}</span>
                      <span className={`rounded px-2 py-0.5 ${statusStyle[p.status]}`}>
                        {statusLabel[p.status]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setAdminView("providers")}
                className="rounded-lg border border-neutral-200 bg-white py-2 text-sm"
              >
                占い師を管理する
              </button>
              <button
                onClick={() => setAdminView("history")}
                className="rounded-lg border border-neutral-200 bg-white py-2 text-sm"
              >
                全取引履歴を見る
              </button>
              <button
                onClick={() => setAdminView("settings")}
                className="rounded-lg border border-neutral-200 bg-white py-2 text-sm"
              >
                決済設定(Stripe)
              </button>
            </div>
          )}

          {adminView === "providers" && (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setAdminView("overview")}
                className="self-start text-xs text-neutral-500"
              >
                ← 概要に戻る
              </button>
              <p className="text-sm font-medium">占い師管理</p>
              {providerList.map((p) => (
                <div key={p.id} className="rounded-xl border border-neutral-200 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-neutral-500">
                        {p.tag} ★{p.rating} ・チャット{p.chatRate}pt/通
                      </p>
                    </div>
                    <span className={`rounded px-2 py-0.5 text-xs ${statusStyle[p.status]}`}>
                      {statusLabel[p.status]}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    {(["available", "busy", "off"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => updateProviderStatus(p.id, s)}
                        className={`flex-1 rounded border py-1 text-xs ${
                          p.status === s
                            ? "border-neutral-900 bg-neutral-900 text-white"
                            : "border-neutral-200"
                        }`}
                      >
                        {statusLabel[s]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {adminView === "history" && (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setAdminView("overview")}
                className="self-start text-xs text-neutral-500"
              >
                ← 概要に戻る
              </button>
              <p className="text-sm font-medium">全取引履歴(デモお客様分)</p>
              <div className="flex flex-col gap-2">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3"
                  >
                    <div>
                      <p className="text-sm">{h.label}</p>
                      <p className="text-xs text-neutral-500">
                        {h.detail} ・ {h.date}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        h.points >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {h.points >= 0 ? "+" : ""}
                      {h.points}pt
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminView === "settings" && (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setAdminView("overview")}
                className="self-start text-xs text-neutral-500"
              >
                ← 概要に戻る
              </button>
              <p className="text-sm font-medium">決済設定(Stripe)</p>

              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-neutral-600">
                    公開可能キー(pk_で始まるもの)
                  </span>
                  <input
                    value={stripePubKey}
                    onChange={(e) => {
                      setStripePubKey(e.target.value);
                      setStripeSaved(false);
                    }}
                    placeholder="pk_live_xxxxxxxx"
                    className="rounded border border-neutral-200 px-2 py-2 text-xs"
                  />
                </label>
                <label className="mt-3 flex flex-col gap-1">
                  <span className="text-xs text-neutral-600">
                    シークレットキー(sk_で始まるもの)
                  </span>
                  <input
                    type="password"
                    value={stripeSecretKey}
                    onChange={(e) => {
                      setStripeSecretKey(e.target.value);
                      setStripeSaved(false);
                    }}
                    placeholder="sk_live_xxxxxxxx"
                    className="rounded border border-neutral-200 px-2 py-2 text-xs"
                  />
                </label>
                <button
                  onClick={() => setStripeSaved(true)}
                  className="mt-3 w-full rounded-lg bg-neutral-900 py-2 text-sm text-white"
                >
                  この画面に一時保存(デモ)
                </button>
                {stripeSaved && (
                  <p className="mt-2 text-xs text-emerald-600">
                    入力を確認しました。実際の反映にはVercel側の設定が必要です(下記参照)。
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                <p className="font-medium">実際に反映させるには</p>
                <ol className="mt-1 list-decimal pl-4">
                  <li>公開可能キー(pk_)は、そのままこの画面の値を本番コードで使ってOKです</li>
                  <li>
                    シークレットキー(sk_)は、Vercelプロジェクトの
                    「Settings → Environment Variables」に
                    <code className="mx-1 rounded bg-white px-1">STRIPE_SECRET_KEY</code>
                    として登録してください
                  </li>
                  <li>
                    登録後、サーバー側(API Route)からのみそのキーを読み込む形で決済処理を実装します
                  </li>
                </ol>
                <p className="mt-2">
                  この画面自体には保存機能はなく(ブラウザを閉じると消えます)、あくまで入力内容の確認・共有用です。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------- 占い師モード(デモ) ----------
  if (authStep === "provider") {
    const me = providerList.find((p) => p.id === loggedInProviderId)!;
    const myEarnings = history
      .filter((h) => h.label.includes(me.name) && h.points < 0)
      .reduce((sum, h) => sum + Math.abs(h.points), 0);
    const myLogs = history.filter((h) => h.label.includes(me.name));

    return (
      <div className="min-h-screen bg-neutral-50 flex justify-center pb-20 pt-8 px-4">
        <div className="w-full max-w-sm">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-lg font-medium">占い師モード</h1>
            <button onClick={() => setAuthStep("login")} className="text-xs text-neutral-500">
              ログアウト
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-base font-medium text-purple-700">
                  {me.name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium">{me.name}</p>
                  <p className="text-xs text-neutral-500">
                    {me.tag} ★{me.rating} ・チャット{me.chatRate}pt/通
                  </p>
                </div>
              </div>
              <p className="mb-1 mt-3 text-xs text-neutral-500">ステータス</p>
              <div className="flex gap-2">
                {(["available", "busy", "off"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => updateProviderStatus(me.id, s)}
                    className={`flex-1 rounded border py-1.5 text-xs ${
                      me.status === s
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-200"
                    }`}
                  >
                    {statusLabel[s]}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <p className="text-xs text-neutral-500">今月の受取見込み(デモ)</p>
              <p className="mt-1 text-lg font-medium">{myEarnings.toLocaleString()}pt</p>
              <p className="mt-1 text-[10px] text-neutral-400">
                ※ 実際にはここから運営手数料を差し引いた額がStripe Connect経由で出金されます
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-3">
              <p className="mb-2 text-xs font-medium text-neutral-600">対応履歴</p>
              {myLogs.length === 0 && (
                <p className="text-xs text-neutral-400">まだ対応履歴がありません</p>
              )}
              <div className="flex flex-col gap-2">
                {myLogs.map((h) => (
                  <div key={h.id} className="flex items-center justify-between text-xs">
                    <div>
                      <p>{h.label}</p>
                      <p className="text-neutral-400">
                        {h.detail} ・ {h.date}
                      </p>
                    </div>
                    <span className="text-emerald-600">+{Math.abs(h.points)}pt</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- 登録前 ----------
  if (authStep === "register") {
    return (
      <div className="min-h-screen bg-neutral-50 flex justify-center py-10 px-4">
        <div className="w-full max-w-sm">
          <button
            onClick={() => setAuthStep("login")}
            className="mb-2 text-xs text-neutral-500"
          >
            ← ログインに戻る
          </button>
          <h1 className="mb-1 text-lg font-medium">はじめまして</h1>
          <p className="mb-4 text-xs text-neutral-500">
            占いに必要な情報を入力してください
          </p>
          <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-neutral-600">お名前</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="占い 花子"
                className="rounded border border-neutral-200 px-2 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-neutral-600">生年月日</span>
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="rounded border border-neutral-200 px-2 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-neutral-600">性別</span>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="rounded border border-neutral-200 px-2 py-2 text-sm"
              >
                <option value="">選択してください</option>
                <option value="female">女性</option>
                <option value="male">男性</option>
                <option value="other">その他・回答しない</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-neutral-600">メールアドレス</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="rounded border border-neutral-200 px-2 py-2 text-sm"
              />
            </label>
            {formError && <p className="text-xs text-red-600">{formError}</p>}
            <button
              onClick={submitRegistration}
              className="mt-1 rounded-lg bg-neutral-900 py-2 text-sm text-white"
            >
              登録して800pt獲得する
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#faf7f2] flex justify-center px-0 sm:px-4 sm:py-8">
      <div className="flex h-full w-full max-w-sm flex-col bg-[#faf7f2] sm:rounded-3xl sm:shadow-xl overflow-hidden">
        <div className="relative h-24 shrink-0 overflow-hidden bg-gradient-to-br from-purple-800 via-purple-600 to-amber-500">
          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/10" />
          <button
            onClick={() => {
              setTab("mypage");
              setMypageView("top");
            }}
            className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-purple-800"
          >
            保有 {points}pt
          </button>
          <div className="relative flex h-full flex-col justify-end p-5 pb-4">
            <p className="text-[9px] tracking-[0.2em] text-white/70">SUGINOIZUMI ONLINE</p>
            <h1 className="text-xl font-bold text-white">杉の泉</h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 pb-24">

        {tab === "home" && (
          <>
            {step === "providers" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-neutral-900">今、話せる占い師</h2>
                </div>
                <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
                  {providerList.map((p, i) => (
                    <div
                      key={p.id}
                      onClick={() => viewDetail(p)}
                      className="w-36 shrink-0 cursor-pointer"
                    >
                      <div className="relative mb-2 h-36 w-36 overflow-hidden rounded-2xl bg-gradient-to-br from-purple-200 via-purple-100 to-amber-100">
                        <div className="flex h-full items-center justify-center text-3xl">🔮</div>
                        {i === 0 && (
                          <span className="absolute left-1.5 top-1.5 rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-bold text-white">
                            殿堂入り
                          </span>
                        )}
                        <span className={`absolute bottom-1.5 right-1.5 rounded-full px-2 py-0.5 text-[9px] ${statusStyle[p.status]}`}>
                          {statusLabel[p.status]}
                        </span>
                      </div>
                      <p className="truncate text-xs font-bold text-neutral-900">{p.name}</p>
                      <p className="truncate text-[10px] text-neutral-500">{p.tag}</p>
                      <p className="mt-0.5 text-[10px] font-medium text-purple-700">
                        ★{p.rating} ・ {p.chatRate}pt/文字
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2">
                  {providerList.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => viewDetail(p)}
                      className="flex cursor-pointer items-center gap-3 rounded-2xl border border-purple-100 bg-white p-3"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-sm font-medium text-purple-700">
                        {p.name[0]}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-neutral-500">
                          {p.tag} ★{p.rating}({p.reviewCount.toLocaleString()}件)
                        </p>
                        <p className="text-xs text-neutral-400">
                          チャット {p.chatRate}pt/文字
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`rounded px-2 py-0.5 text-xs ${statusStyle[p.status]}`}>
                          {statusLabel[p.status]}
                        </span>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => selectProvider(p)}
                            disabled={p.status !== "available"}
                            className="rounded border border-neutral-200 px-2 py-1 text-xs disabled:opacity-40"
                          >
                            通話
                          </button>
                          <button
                            onClick={() => startChat(p)}
                            disabled={p.status === "off"}
                            className="rounded border border-neutral-200 px-2 py-1 text-xs disabled:opacity-40"
                          >
                            チャット
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === "detail" && provider && (
              <div className="flex flex-col gap-3 pb-16">
                <button
                  onClick={() => setStep("providers")}
                  className="self-start text-xs text-neutral-500"
                >
                  ← 一覧に戻る
                </button>

                <div className="relative h-40 overflow-hidden rounded-2xl bg-gradient-to-br from-purple-800 via-purple-600 to-amber-500">
                  <div className="flex h-full items-center justify-center text-3xl">🔮</div>
                  <button
                    onClick={() => toggleFavorite(provider.id)}
                    className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs"
                  >
                    {favorites.includes(provider.id) ? "❤️" : "🤍"} お気に入り
                  </button>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <span>★ {provider.rating}</span>
                  <span className="text-neutral-500">
                    鑑定数 {provider.reviewCount.toLocaleString()}件
                  </span>
                </div>

                <div className="flex gap-2">
                  {provider.styleTags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-purple-50 px-3 py-1 text-xs text-purple-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="flex rounded-lg bg-neutral-100 p-1 text-xs">
                  <button
                    onClick={() => setDetailTab("profile")}
                    className={`flex-1 rounded-md py-1.5 ${
                      detailTab === "profile" ? "bg-white font-medium" : "text-neutral-500"
                    }`}
                  >
                    プロフィール
                  </button>
                  <button
                    onClick={() => setDetailTab("reviews")}
                    className={`flex-1 rounded-md py-1.5 ${
                      detailTab === "reviews" ? "bg-white font-medium" : "text-neutral-500"
                    }`}
                  >
                    感謝の声
                  </button>
                </div>

                {detailTab === "profile" && (
                  <div className="flex flex-col gap-2 text-sm">
                    <p className="font-medium">{provider.tag}鑑定歴 5年以上</p>
                    <p className="leading-relaxed text-neutral-600">{provider.bio}</p>
                  </div>
                )}

                {detailTab === "reviews" && (
                  <div className="flex flex-col gap-3 text-xs">
                    <div className="border-b border-neutral-100 pb-2">
                      <p className="font-medium">30代 女性 ★★★★★</p>
                      <p className="mt-1 text-neutral-600">
                        いつも的確なアドバイスをありがとうございます。安心してお話しできました。
                      </p>
                    </div>
                    <div className="border-b border-neutral-100 pb-2">
                      <p className="font-medium">40代 女性 ★★★★☆</p>
                      <p className="mt-1 text-neutral-600">
                        テンポよく話を聞いてくださり、気持ちが軽くなりました。
                      </p>
                    </div>
                  </div>
                )}

                <div className="fixed inset-x-0 bottom-14 flex justify-center">
                  <div className="flex w-full max-w-sm">
                    <button
                      onClick={() => startChat(provider)}
                      disabled={provider.status === "off"}
                      className="flex-1 bg-purple-700 py-3 text-center text-xs text-white disabled:opacity-40"
                    >
                      チャット
                      <br />
                      {provider.chatRate}pt / 1文字
                    </button>
                    <button
                      onClick={() => selectProvider(provider)}
                      disabled={provider.status !== "available"}
                      className="flex-1 bg-purple-600 py-3 text-center text-xs text-white disabled:opacity-40"
                    >
                      電話
                      <br />
                      {provider.callRate}pt / 1分
                    </button>
                    <button
                      disabled
                      className="flex-1 bg-purple-500 py-3 text-center text-xs text-white opacity-60"
                    >
                      メール
                      <br />
                      {provider.mailRate.toLocaleString()}pt / 1回
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === "booking" && provider && (
              <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-4">
                <button
                  onClick={() => setStep("providers")}
                  className="self-start text-xs text-neutral-500"
                >
                  ← 担当選択に戻る
                </button>
                <p className="text-sm font-medium">{provider.name} を予約</p>

                <div>
                  <p className="mb-2 text-xs font-medium text-neutral-600">コース</p>
                  <div className="grid grid-cols-2 gap-2">
                    {courses.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setCourse(c)}
                        className={`rounded-lg border p-2 text-left ${
                          course?.id === c.id
                            ? "border-purple-500 bg-purple-50"
                            : "border-neutral-200"
                        }`}
                      >
                        <p className="text-sm font-medium">{c.label}</p>
                        <p className="text-xs text-neutral-500">{c.points}pt</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium text-neutral-600">時間</p>
                  <div className="grid grid-cols-2 gap-2">
                    {times.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTime(t)}
                        className={`rounded-lg border p-2 text-xs ${
                          time === t ? "border-purple-500 bg-purple-50" : "border-neutral-200"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={confirmBooking}
                  disabled={!course || !time}
                  className="mt-2 rounded-lg bg-neutral-900 py-2 text-sm text-white disabled:opacity-40"
                >
                  次へ
                </button>
              </div>
            )}

            {step === "checkout" && provider && course && (
              <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4">
                <button
                  onClick={() => setStep("booking")}
                  className="self-start text-xs text-neutral-500"
                >
                  ← 戻る
                </button>
                <p className="text-sm font-medium">予約内容の確認</p>
                <div className="rounded-lg bg-neutral-50 p-3 text-sm">
                  <p>
                    {provider.name} / {course.label} / {time}
                  </p>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">保有ポイント</span>
                  <span className="font-medium">{points}pt</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">コース料金</span>
                  <span className="font-medium text-red-600">-{course.points}pt</span>
                </div>
                {course.points > points && (
                  <p className="text-xs text-amber-600">
                    ポイントが不足しています。購入画面に移動します。
                  </p>
                )}
                <button
                  onClick={pay}
                  className="mt-2 rounded-lg bg-purple-600 py-2 text-sm text-white"
                >
                  {course.points > points ? "ポイントを購入する" : "確定する"}
                </button>
              </div>
            )}

            {step === "call" && provider && course && (
              <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-3">
                <div className="relative h-48 overflow-hidden rounded-lg bg-neutral-800">
                  <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                    {provider.name}(メイン映像)
                  </div>
                  <div className="absolute right-2 top-2 flex h-14 w-20 items-center justify-center rounded bg-neutral-700 text-center text-[10px] text-neutral-300">
                    手元
                    <br />
                    (タロット)
                  </div>
                  {!cameraOn && (
                    <div className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-[10px] text-white">
                      自分のカメラ: OFF
                    </div>
                  )}
                  {preCall && (
                    <div className="absolute inset-x-2 top-2 rounded bg-black/60 px-2 py-1 text-center text-[10px] text-white">
                      プレ通話中(無料・準備時間)
                    </div>
                  )}
                  <div className="absolute inset-x-2 bottom-2 rounded bg-black/40 px-2 py-1">
                    <p className="truncate text-[11px] text-white">
                      {chat[chat.length - 1]}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>{preCall ? "プレ通話" : `残り ${course.minutes}:00`}</span>
                  <button
                    onClick={() => setCameraOn((v) => !v)}
                    className="rounded border border-neutral-200 px-2 py-1"
                  >
                    カメラ{cameraOn ? "OFF" : "ON"}にする
                  </button>
                  <span>保有 {points}pt</span>
                </div>

                <div className="max-h-24 overflow-y-auto rounded bg-neutral-50 p-2 text-xs">
                  {chat.map((c, i) => (
                    <p key={i} className="mb-1">
                      {c}
                    </p>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="メッセージを送る"
                    className="flex-1 rounded border border-neutral-200 px-2 py-1 text-xs"
                  />
                  <button
                    onClick={sendMessage}
                    className="rounded border border-neutral-200 px-2 py-1 text-xs"
                  >
                    送信
                  </button>
                </div>

                <div className="flex gap-2">
                  {[100, 300, 500].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => sendGift(amt)}
                      className="flex-1 rounded border border-neutral-200 py-1 text-xs"
                    >
                      投げ銭 {amt}pt
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setStep("providers");
                    setProvider(null);
                    setCourse(null);
                    setTime(null);
                  }}
                  className="mt-1 rounded bg-neutral-900 py-2 text-xs text-white"
                >
                  通話を終了する
                </button>
              </div>
            )}

            {step === "chat" && provider && (
              <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-3">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setStep("providers");
                      setProvider(null);
                    }}
                    className="text-xs text-neutral-500"
                  >
                    ← 戻る
                  </button>
                  <p className="text-xs text-neutral-500">
                    1通 {provider.chatRate}pt ・ 保有 {points}pt
                  </p>
                </div>
                <p className="text-sm font-medium">{provider.name} とチャット占い</p>
                <div className="flex max-h-72 flex-col gap-2 overflow-y-auto rounded-lg bg-neutral-50 p-3">
                  {chatMsgs.map((m, i) => (
                    <div
                      key={i}
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${
                        m.from === "user"
                          ? "ml-auto bg-purple-600 text-white"
                          : "bg-white border border-neutral-200"
                      }`}
                    >
                      {m.text}
                    </div>
                  ))}
                  {chatSending && (
                    <div className="max-w-[80%] rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-400">
                      入力中...
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                    placeholder={`メッセージを送る(${provider.chatRate}pt)`}
                    className="flex-1 rounded border border-neutral-200 px-2 py-2 text-xs"
                  />
                  <button
                    onClick={sendChatMessage}
                    className="rounded bg-neutral-900 px-3 py-2 text-xs text-white"
                  >
                    送信
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {tab === "history" && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">予約・利用履歴</p>
            {history.length === 0 && (
              <p className="text-xs text-neutral-400">まだ履歴はありません</p>
            )}
            {history.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3"
              >
                <div>
                  <p className="text-sm">{h.label}</p>
                  <p className="text-xs text-neutral-500">
                    {h.detail} ・ {h.date}
                  </p>
                </div>
                <span
                  className={`text-sm font-medium ${
                    h.points >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {h.points >= 0 ? "+" : ""}
                  {h.points}pt
                </span>
              </div>
            ))}
          </div>
        )}

        {tab === "messages" && (
          <div className="flex flex-col gap-3">
            <div className="flex gap-4 border-b border-neutral-200 pb-2 text-xs">
              <span className="font-medium text-purple-700">あなた宛</span>
              <span className="text-neutral-400">お気に入り</span>
              <span className="text-neutral-400">タイムライン</span>
            </div>
            <p className="mt-10 text-center text-xs text-neutral-400">
              鑑定師からあなたへのメッセージが届くと
              <br />
              ここに表示されます
            </p>
          </div>
        )}

        {tab === "shop" && (
          <>
            {shopView === "list" && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">占いグッズ</p>
                  <button
                    onClick={() => setShopView("cart")}
                    className="rounded border border-neutral-200 px-3 py-1 text-xs"
                  >
                    カート({cart.reduce((s, l) => s + l.qty, 0)})
                  </button>
                </div>
                {["水晶", "数珠", "タロット"].map((category) => (
                  <div key={category} className="flex flex-col gap-2">
                    <p className="text-xs font-medium text-neutral-500">{category}</p>
                    {products
                      .filter((p) => p.category === category)
                      .map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-3"
                        >
                          <div className="pr-2">
                            <p className="text-sm font-medium">{p.name}</p>
                            <p className="text-xs text-neutral-500">{p.desc}</p>
                            <p className="mt-1 text-xs font-medium text-neutral-700">
                              {p.points.toLocaleString()}pt
                            </p>
                          </div>
                          <button
                            onClick={() => addToCart(p.id)}
                            className="shrink-0 rounded bg-neutral-900 px-3 py-1.5 text-xs text-white"
                          >
                            追加
                          </button>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            )}

            {shopView === "cart" && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setShopView("list")}
                  className="self-start text-xs text-neutral-500"
                >
                  ← 商品一覧に戻る
                </button>
                <p className="text-sm font-medium">カート</p>
                {cart.length === 0 && (
                  <p className="text-xs text-neutral-500">カートは空です</p>
                )}
                {cart.map((line) => {
                  const p = productMap[line.productId];
                  return (
                    <div
                      key={line.productId}
                      className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3"
                    >
                      <div>
                        <p className="text-sm">{p.name}</p>
                        <p className="text-xs text-neutral-500">
                          {p.points.toLocaleString()}pt × {line.qty}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => changeQty(line.productId, -1)}
                          className="h-6 w-6 rounded border border-neutral-200 text-xs"
                        >
                          -
                        </button>
                        <span className="text-xs">{line.qty}</span>
                        <button
                          onClick={() => changeQty(line.productId, 1)}
                          className="h-6 w-6 rounded border border-neutral-200 text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
                {cart.length > 0 && (
                  <>
                    <div className="flex justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm">
                      <span className="text-neutral-500">合計</span>
                      <span className="font-medium">{cartTotal().toLocaleString()}pt</span>
                    </div>
                    <div className="flex justify-between text-xs text-neutral-500">
                      <span>保有ポイント</span>
                      <span>{points.toLocaleString()}pt</span>
                    </div>
                    <button
                      onClick={checkoutCart}
                      className="rounded-lg bg-purple-600 py-2 text-sm text-white"
                    >
                      ポイントで購入する
                    </button>
                  </>
                )}
                {shopMessage && (
                  <p className="text-xs text-amber-600">{shopMessage}</p>
                )}
              </div>
            )}
          </>
        )}

        {tab === "mypage" && (
          <>
            {mypageView === "top" && (
              <div className="flex flex-col gap-3">
                <div className="rounded-xl border border-neutral-200 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-base font-medium text-purple-700">
                      {name ? name[0] : "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-xs text-neutral-500">{email}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
                    <span className="text-xs text-neutral-500">保有ポイント</span>
                    <span className="text-sm font-medium">{points}pt</span>
                  </div>
                  <button
                    onClick={() => setMypageView("purchase")}
                    className="mt-2 w-full rounded-lg bg-purple-600 py-2 text-sm text-white"
                  >
                    ポイントを購入する
                  </button>
                </div>

                <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-2">
                  <button
                    onClick={() => setTab("history")}
                    className="flex items-center justify-between rounded-lg px-2 py-3 text-left text-sm"
                  >
                    <span>予約・利用履歴</span>
                    <span className="text-neutral-400">›</span>
                  </button>
                  <div className="border-t border-neutral-100" />
                  <button
                    onClick={() => {
                      setTab("shop");
                      setShopView("list");
                    }}
                    className="flex items-center justify-between rounded-lg px-2 py-3 text-left text-sm"
                  >
                    <span>占いグッズ(水晶・数珠など)</span>
                    <span className="text-neutral-400">›</span>
                  </button>
                  <div className="border-t border-neutral-100" />
                  <button
                    onClick={() => setMypageView("edit")}
                    className="flex items-center justify-between rounded-lg px-2 py-3 text-left text-sm"
                  >
                    <span>登録情報の編集</span>
                    <span className="text-neutral-400">›</span>
                  </button>
                  <div className="border-t border-neutral-100" />
                  <button className="flex items-center justify-between rounded-lg px-2 py-3 text-left text-sm text-neutral-400">
                    <span>支払い方法の登録(準備中)</span>
                    <span>›</span>
                  </button>
                  <div className="border-t border-neutral-100" />
                  <button
                    onClick={() => {
                      setLegalDoc("terms");
                      setMypageView("terms");
                    }}
                    className="flex items-center justify-between rounded-lg px-2 py-3 text-left text-sm"
                  >
                    <span>利用規約</span>
                    <span className="text-neutral-400">›</span>
                  </button>
                  <div className="border-t border-neutral-100" />
                  <button
                    onClick={() => {
                      setLegalDoc("privacy");
                      setMypageView("terms");
                    }}
                    className="flex items-center justify-between rounded-lg px-2 py-3 text-left text-sm"
                  >
                    <span>プライバシーポリシー</span>
                    <span className="text-neutral-400">›</span>
                  </button>
                  <div className="border-t border-neutral-100" />
                  <button
                    onClick={() => {
                      setLegalDoc("tokushoho");
                      setMypageView("terms");
                    }}
                    className="flex items-center justify-between rounded-lg px-2 py-3 text-left text-sm"
                  >
                    <span>特定商取引法に基づく表記</span>
                    <span className="text-neutral-400">›</span>
                  </button>
                </div>

                <button
                  onClick={() => setAuthStep("login")}
                  className="rounded-lg border border-neutral-200 bg-white py-2 text-sm text-neutral-500"
                >
                  ログアウト
                </button>
              </div>
            )}

            {mypageView === "purchase" && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setMypageView("top")}
                  className="self-start text-xs text-neutral-500"
                >
                  ← マイページに戻る
                </button>
                <p className="text-sm font-medium">ポイントを購入</p>
                {pointPacks.map((pack) => (
                  <button
                    key={pack.id}
                    onClick={() => buyPack(pack)}
                    className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 text-left"
                  >
                    <div>
                      <p className="text-sm font-medium">{pack.points.toLocaleString()}pt</p>
                      <p className="text-xs text-neutral-500">
                        ¥{pack.price.toLocaleString()}(税込・ダミー決済)
                      </p>
                    </div>
                    <span className="rounded bg-neutral-900 px-3 py-1 text-xs text-white">
                      購入
                    </span>
                  </button>
                ))}
                <p className="text-xs text-neutral-400">
                  ※ 決済は現在ダミーです。Stripe接続後に実決済になります。
                </p>
              </div>
            )}

            {mypageView === "edit" && (
              <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4">
                <button
                  onClick={() => setMypageView("top")}
                  className="self-start text-xs text-neutral-500"
                >
                  ← マイページに戻る
                </button>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-neutral-600">お名前</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded border border-neutral-200 px-2 py-2 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-neutral-600">生年月日</span>
                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="rounded border border-neutral-200 px-2 py-2 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-neutral-600">メールアドレス</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded border border-neutral-200 px-2 py-2 text-sm"
                  />
                </label>
                <button
                  onClick={() => setMypageView("top")}
                  className="mt-1 rounded-lg bg-neutral-900 py-2 text-sm text-white"
                >
                  保存する
                </button>
              </div>
            )}

            {mypageView === "terms" && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setMypageView("top")}
                  className="self-start text-xs text-neutral-500"
                >
                  ← マイメニューに戻る
                </button>

                {legalDoc === "terms" && (
                  <div className="rounded-xl border border-neutral-200 bg-white p-4 text-xs leading-relaxed text-neutral-700">
                    <p className="mb-3 text-sm font-medium">利用規約</p>
                    <p className="mb-2">
                      本規約は、杉の泉オンライン占いサービス(以下「本サービス」)の利用条件を定めるものです。ユーザーは本規約に同意の上、本サービスをご利用ください。
                    </p>
                    <p className="mb-2">第1条(適用) 本規約は、本サービスの利用に関する運営者とユーザーとの間の一切の関係に適用されます。</p>
                    <p className="mb-2">第2条(禁止事項) ユーザーは、法令又は公序良俗に違反する行為、犯罪行為に関連する行為、鑑定師への誹謗中傷、その他運営者が不適切と判断する行為を行ってはなりません。</p>
                    <p className="mb-2">第3条(ポイント) 本サービス内で使用するポイントは、購入した時点から一定の有効期限を設けるものとし、詳細は別途定めます。ポイントの払い戻しは原則として行いません。</p>
                    <p className="mb-2">第4条(免責事項) 本サービスで提供される占い・鑑定結果は、エンターテインメントとしての参考情報であり、その内容の正確性や結果について運営者は一切の責任を負いません。</p>
                    <p className="mb-2">第5条(禁止する相談内容) 人の生死に関わること(妊娠・出産の有無を含む)、その他法令に抵触する相談については、鑑定をお断りする場合があります。</p>
                    <p className="text-neutral-400">※ この文面は仮のサンプルです。実際の公開前に、内容の精査・弁護士等への確認をお願いします。</p>
                  </div>
                )}

                {legalDoc === "privacy" && (
                  <div className="rounded-xl border border-neutral-200 bg-white p-4 text-xs leading-relaxed text-neutral-700">
                    <p className="mb-3 text-sm font-medium">プライバシーポリシー</p>
                    <p className="mb-2">
                      運営者は、ユーザーの個人情報(氏名、生年月日、メールアドレス等)を、本サービスの提供・ポイント管理・お問い合わせ対応の目的にのみ利用します。
                    </p>
                    <p className="mb-2">取得した情報は、法令に基づく場合を除き、ユーザーの同意なく第三者へ提供しません。</p>
                    <p className="mb-2">決済に関する情報は、Stripe社等の決済代行事業者を通じて処理され、カード番号等の情報は運営者のサーバーには保存されません。</p>
                    <p className="text-neutral-400">※ この文面は仮のサンプルです。実際の公開前に、内容の精査をお願いします。</p>
                  </div>
                )}

                {legalDoc === "tokushoho" && (
                  <div className="rounded-xl border border-neutral-200 bg-white p-4 text-xs leading-relaxed text-neutral-700">
                    <p className="mb-3 text-sm font-medium">特定商取引法に基づく表記</p>
                    <div className="flex flex-col gap-2">
                      <p>販売事業者: (仮)運営会社名</p>
                      <p>運営責任者: (仮)責任者名</p>
                      <p>所在地: (仮)住所を記載</p>
                      <p>連絡先: (仮)電話番号・メールアドレス</p>
                      <p>販売価格: 各ポイントパック購入画面に表示の金額(税込)</p>
                      <p>お支払い方法: クレジットカード決済(Stripe)</p>
                      <p>サービス提供時期: 決済完了後、即時にポイントを付与</p>
                      <p>返品・キャンセル: デジタルコンテンツの性質上、購入後の返金は原則不可</p>
                    </div>
                    <p className="mt-2 text-neutral-400">※ この文面は仮のサンプルです。実際の情報に差し替えてください。</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 flex justify-center border-t border-neutral-200 bg-white">
        <div className="relative flex w-full max-w-sm items-end">
          <button
            onClick={() => setTab("messages")}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] ${
              tab === "messages" ? "font-medium text-purple-700" : "text-neutral-400"
            }`}
          >
            <span className="text-base">✉️</span>
            メッセージ
          </button>
          <button
            onClick={() => {
              setTab("shop");
              setShopView("list");
            }}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] ${
              tab === "shop" ? "font-medium text-purple-700" : "text-neutral-400"
            }`}
          >
            <span className="text-base">🛍️</span>
            グッズ
          </button>

          <div className="flex flex-1 justify-center">
            <button
              onClick={() => setTab("home")}
              className={`absolute -top-6 flex h-16 w-16 items-center justify-center rounded-full text-2xl shadow-lg ring-4 ring-white ${
                tab === "home" ? "bg-purple-700" : "bg-purple-500"
              }`}
            >
              🔮
            </button>
          </div>

          <button
            onClick={() => setTab("history")}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] ${
              tab === "history" ? "font-medium text-purple-700" : "text-neutral-400"
            }`}
          >
            <span className="text-base">🕘</span>
            履歴
          </button>
          <button
            onClick={() => {
              setTab("mypage");
              setMypageView("top");
            }}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] ${
              tab === "mypage" ? "font-medium text-purple-700" : "text-neutral-400"
            }`}
          >
            <span className="text-base">👤</span>
            マイページ
          </button>
        </div>
      </nav>
    </div>
  );
}

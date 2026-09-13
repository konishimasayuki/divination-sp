"use client";

import { useState } from "react";

type Provider = {
  id: string;
  name: string;
  tag: string;
  rating: number;
  status: "available" | "busy" | "off";
  chatRate: number; // 1通あたりのポイント
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

type Tab = "home" | "shop" | "mypage";
type MainStep = "providers" | "booking" | "checkout" | "call" | "chat";
type MypageView = "top" | "edit" | "purchase" | "history";
type ShopView = "list" | "cart";

const providers: Provider[] = [
  { id: "p1", name: "紗希先生", tag: "タロット・恋愛", rating: 4.9, status: "available", chatRate: 50 },
  { id: "p2", name: "蓮先生", tag: "四柱推命", rating: 4.8, status: "busy", chatRate: 60 },
  { id: "p3", name: "美月先生", tag: "霊感・霊視", rating: 4.7, status: "off", chatRate: 80 },
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
    if (loginEmail === "provider" && loginPassword === "provider") {
      setAuthStep("provider");
      return;
    }
    // デモ用: それ以外はお客様ログイン。登録済みならアプリへ、未登録なら会員登録へ
    if (registered) {
      setAuthStep("app");
    } else {
      setAuthStep("register");
    }
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
      <div className="min-h-screen bg-neutral-50 flex justify-center py-10 px-4">
        <div className="w-full max-w-sm">
          <h1 className="mb-1 text-lg font-medium">ログイン</h1>
          <p className="mb-4 text-xs text-neutral-500">
            オンライン占い(デモ)へようこそ
          </p>
          <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-neutral-600">メールアドレス</span>
              <input
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="name@example.com"
                className="rounded border border-neutral-200 px-2 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-neutral-600">パスワード</span>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded border border-neutral-200 px-2 py-2 text-sm"
              />
            </label>
            {loginError && <p className="text-xs text-red-600">{loginError}</p>}
            <button
              onClick={handleLogin}
              className="mt-1 rounded-lg bg-neutral-900 py-2 text-sm text-white"
            >
              ログイン
            </button>
          </div>
          <button
            onClick={() => setAuthStep("register")}
            className="mt-4 w-full text-center text-xs text-blue-600 underline"
          >
            はじめての方はこちら(会員登録)
          </button>
          <p className="mt-6 text-center text-[10px] text-neutral-400">
            デモ用ログイン: 管理者 z / z ・ 占い師 provider / provider
            <br />
            それ以外はお客様として扱われます(未登録なら会員登録へ)
          </p>
        </div>
      </div>
    );
  }

  // ---------- 管理者モード(デモ) ----------
  if (authStep === "admin") {
    return (
      <div className="min-h-screen bg-neutral-50 flex justify-center py-10 px-4">
        <div className="w-full max-w-sm">
          <button
            onClick={() => setAuthStep("login")}
            className="mb-4 text-xs text-neutral-500"
          >
            ← ログアウト
          </button>
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-sm font-medium">スーパー管理者モード</p>
            <p className="mt-2 text-xs text-neutral-500">
              占い師管理・売上集計・ユーザー管理などをここに追加予定(準備中)
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---------- 占い師モード(デモ) ----------
  if (authStep === "provider") {
    return (
      <div className="min-h-screen bg-neutral-50 flex justify-center py-10 px-4">
        <div className="w-full max-w-sm">
          <button
            onClick={() => setAuthStep("login")}
            className="mb-4 text-xs text-neutral-500"
          >
            ← ログアウト
          </button>
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-sm font-medium">占い師モード</p>
            <p className="mt-2 text-xs text-neutral-500">
              ステータス切り替え(対応可能/鑑定中/休止中)・チャット対応・報酬確認などをここに追加予定(準備中)
            </p>
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
    <div className="min-h-screen bg-neutral-50 flex justify-center pb-20 pt-8 px-4">
      <div className="w-full max-w-sm">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-medium">オンライン占い(デモ)</h1>
          <button
            onClick={() => {
              setTab("mypage");
              setMypageView("top");
            }}
            className="text-sm text-neutral-500"
          >
            保有 {points}pt
          </button>
        </header>

        {tab === "home" && (
          <>
            {step === "providers" && (
              <div className="flex flex-col gap-2">
                {providers.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700">
                      {p.name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-neutral-500">
                        {p.tag} ★{p.rating}
                      </p>
                      <p className="text-xs text-neutral-400">
                        チャット {p.chatRate}pt/通
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`rounded px-2 py-0.5 text-xs ${statusStyle[p.status]}`}>
                        {statusLabel[p.status]}
                      </span>
                      <div className="flex gap-1">
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
                            ? "border-blue-500 bg-blue-50"
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
                          time === t ? "border-blue-500 bg-blue-50" : "border-neutral-200"
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
                  className="mt-2 rounded-lg bg-blue-600 py-2 text-sm text-white"
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
                          ? "ml-auto bg-blue-600 text-white"
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
                      className="rounded-lg bg-blue-600 py-2 text-sm text-white"
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
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-base font-medium text-blue-700">
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
                    className="mt-2 w-full rounded-lg bg-blue-600 py-2 text-sm text-white"
                  >
                    ポイントを購入する
                  </button>
                </div>

                <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-2">
                  <button
                    onClick={() => setMypageView("history")}
                    className="flex items-center justify-between rounded-lg px-2 py-3 text-left text-sm"
                  >
                    <span>予約・利用履歴</span>
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
                </div>
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

            {mypageView === "history" && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setMypageView("top")}
                  className="self-start text-xs text-neutral-500"
                >
                  ← マイページに戻る
                </button>
                <p className="text-sm font-medium">予約・利用履歴</p>
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
          </>
        )}
      </div>

      <nav className="fixed inset-x-0 bottom-0 flex justify-center border-t border-neutral-200 bg-white">
        <div className="flex w-full max-w-sm">
          <button
            onClick={() => setTab("home")}
            className={`flex-1 py-3 text-xs ${
              tab === "home" ? "font-medium text-neutral-900" : "text-neutral-400"
            }`}
          >
            ホーム
          </button>
          <button
            onClick={() => {
              setTab("shop");
              setShopView("list");
            }}
            className={`flex-1 py-3 text-xs ${
              tab === "shop" ? "font-medium text-neutral-900" : "text-neutral-400"
            }`}
          >
            物販
          </button>
          <button
            onClick={() => {
              setTab("mypage");
              setMypageView("top");
            }}
            className={`flex-1 py-3 text-xs ${
              tab === "mypage" ? "font-medium text-neutral-900" : "text-neutral-400"
            }`}
          >
            マイページ
          </button>
        </div>
      </nav>
    </div>
  );
}

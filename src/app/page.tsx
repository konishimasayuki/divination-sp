"use client";

import { useState } from "react";

type Provider = {
  id: string;
  name: string;
  tag: string;
  rating: number;
  status: "available" | "busy" | "off";
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

type Tab = "home" | "mypage";
type MainStep = "providers" | "booking" | "checkout" | "call";
type MypageView = "top" | "edit" | "purchase" | "history";

const providers: Provider[] = [
  { id: "p1", name: "紗希先生", tag: "タロット・恋愛", rating: 4.9, status: "available" },
  { id: "p2", name: "蓮先生", tag: "四柱推命", rating: 4.8, status: "busy" },
  { id: "p3", name: "美月先生", tag: "霊感・霊視", rating: 4.7, status: "off" },
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
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");

  // ナビゲーション
  const [tab, setTab] = useState<Tab>("home");
  const [mypageView, setMypageView] = useState<MypageView>("top");
  const [step, setStep] = useState<MainStep>("providers");

  // 予約フロー
  const [provider, setProvider] = useState<Provider | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [time, setTime] = useState<string | null>(null);

  // ポイント・履歴
  const [points, setPoints] = useState(800);
  const [history, setHistory] = useState<HistoryItem[]>([
    { id: "h1", label: "初回登録特典", detail: "新規登録ボーナス", points: 800, date: "9/1" },
  ]);

  // 通話画面
  const [preCall, setPreCall] = useState(true);
  const [chat, setChat] = useState<string[]>(["お客様: このカードの意味は?"]);
  const [message, setMessage] = useState("");
  const [cameraOn, setCameraOn] = useState(true);

  function submitRegistration() {
    if (!name.trim() || !birthday || !gender || !email.trim()) {
      setFormError("すべての項目を入力してください");
      return;
    }
    setFormError("");
    setRegistered(true);
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

  // ---------- 登録前 ----------
  if (!registered) {
    return (
      <div className="min-h-screen bg-neutral-50 flex justify-center py-10 px-4">
        <div className="w-full max-w-sm">
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
                  <button
                    key={p.id}
                    onClick={() => selectProvider(p)}
                    disabled={p.status !== "available"}
                    className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-left disabled:opacity-60"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700">
                      {p.name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-neutral-500">
                        {p.tag} ★{p.rating}
                      </p>
                    </div>
                    <span className={`rounded px-2 py-0.5 text-xs ${statusStyle[p.status]}`}>
                      {statusLabel[p.status]}
                    </span>
                  </button>
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

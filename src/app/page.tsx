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
  const [step, setStep] = useState<"providers" | "booking" | "checkout" | "call">(
    "providers"
  );
  const [provider, setProvider] = useState<Provider | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [points, setPoints] = useState(800);
  const [preCall, setPreCall] = useState(true);
  const [chat, setChat] = useState<string[]>(["お客様: このカードの意味は?"]);
  const [message, setMessage] = useState("");
  const [cameraOn, setCameraOn] = useState(true);

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
    if (!course) return;
    const shortage = course.points - points;
    if (shortage > 0) {
      setPoints((prev) => prev + shortage); // デモ用ダミー購入
    }
    setPoints((prev) => prev - course.points);
    setStep("call");
    setPreCall(true);
    setTimeout(() => setPreCall(false), 3000); // デモ用: 3秒だけプレ通話扱い
  }

  function sendMessage() {
    if (!message.trim()) return;
    setChat((prev) => [...prev, `お客様: ${message}`]);
    setMessage("");
  }

  function sendGift(amount: number) {
    if (points < amount) return;
    setPoints((prev) => prev - amount);
    setChat((prev) => [...prev, `投げ銭 ${amount}pt を送りました`]);
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex justify-center py-8 px-4">
      <div className="w-full max-w-sm">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-medium">オンライン占い(デモ)</h1>
          <span className="text-sm text-neutral-500">保有 {points}pt</span>
        </header>

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
            <button
              onClick={pay}
              className="mt-2 rounded-lg bg-blue-600 py-2 text-sm text-white"
            >
              {course.points > points
                ? `${course.points - points}pt購入して確定`
                : "確定する"}
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
      </div>
    </div>
  );
}

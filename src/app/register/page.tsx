"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { BackHeader, btnGold, inputCls } from "@/components/ui";

export default function Register() {
  const { register, settings } = useApp();
  const router = useRouter();
  const [f, setF] = useState({ name: "", birthday: "", birthTime: "", gender: "女性", bloodType: "A", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function submit() {
    if (!f.name.trim() || !f.birthday || !f.email.trim() || f.password.length < 4) {
      setError("お名前・生年月日・メールアドレス・パスワード(4文字以上)を入力してください");
      return;
    }
    setBusy(true);
    const err = await register({ ...f, email: f.email.trim() });
    setBusy(false);
    if (err) setError(err);
    else router.replace("/home");
  }

  const choice = (k: "gender" | "bloodType", opts: [string, string][], cols: string) => (
    <div className={`grid ${cols} gap-1.5`}>
      {opts.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => set(k, v)}
          className={`h-11 rounded-xl border text-sm font-medium ${f[k] === v ? "border-gold bg-gold text-ink" : "border-edge bg-card text-soft"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex min-h-[100dvh] justify-center bg-night">
      <div className="w-full max-w-[430px] pb-10" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <BackHeader href="/login" />
        <div className="px-6">
          <h1 className="font-mincho text-[26px] font-bold">はじめまして</h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-lav">より正確に占うために、あなたのことを教えてください。</p>
        </div>
        <div className="mt-5 flex flex-col gap-3.5 px-6">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nm" className="text-xs text-lav">お名前(ニックネーム可)</label>
            <input id="nm" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="占い 花子" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex min-w-0 flex-col gap-1.5">
              <label htmlFor="bd" className="text-xs text-lav">生年月日</label>
              <input id="bd" type="date" value={f.birthday} onChange={(e) => set("birthday", e.target.value)} className={`${inputCls} [color-scheme:dark]`} />
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <label htmlFor="bt" className="text-xs text-lav">出生時間(任意)</label>
              <input id="bt" type="time" value={f.birthTime} onChange={(e) => set("birthTime", e.target.value)} className={`${inputCls} [color-scheme:dark]`} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-lav">性別</span>
            {choice("gender", [["女性", "女性"], ["男性", "男性"], ["その他", "その他"]], "grid-cols-3")}
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-lav">血液型</span>
            {choice("bloodType", [["A", "A"], ["B", "B"], ["O", "O"], ["AB", "AB"], ["?", "不明"]], "grid-cols-5")}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="em" className="text-xs text-lav">メールアドレス</label>
            <input id="em" type="email" autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="name@example.com" className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pw" className="text-xs text-lav">パスワード</label>
            <input id="pw" type="password" autoComplete="new-password" value={f.password} onChange={(e) => set("password", e.target.value)} placeholder="4文字以上" className={inputCls} />
          </div>
          {error && <p className="text-xs text-rose">{error}</p>}
          <button onClick={submit} disabled={busy} className={`${btnGold} mt-2`}>
            {busy ? "登録しています" : `登録して ${settings.signupBonus.toLocaleString()}pt を受け取る`}
          </button>
          <p className="text-center text-[11px] text-dim">
            登録すると <Link href="/legal/terms" className="text-lav underline">利用規約</Link> と{" "}
            <Link href="/legal/privacy" className="text-lav underline">プライバシーポリシー</Link> に同意したものとみなします
          </p>
        </div>
      </div>
    </div>
  );
}

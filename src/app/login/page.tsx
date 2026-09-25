"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { IGift } from "@/components/icons";
import { btnGold, inputCls } from "@/components/ui";

export default function Login() {
  const { login, session, ready, settings } = useApp();
  const router = useRouter();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready || !session) return;
    router.replace(session.role === "user" ? "/home" : session.role === "provider" ? "/provider" : "/admin");
  }, [ready, session, router]);

  async function submit() {
    setBusy(true);
    setError("");
    const err = await login(id.trim(), pw);
    setBusy(false);
    if (err) setError(err);
  }

  return (
    <div className="flex min-h-[100dvh] justify-center bg-night">
      <div className="w-full max-w-[430px] px-6 pb-10" style={{ paddingTop: "calc(env(safe-area-inset-top) + 56px)" }}>
        <div className="flex flex-col items-center gap-2.5">
          <img src="/home-icon.png" alt="" className="h-24 w-24 object-contain" />
          <span className="pl-[0.24em] font-mincho text-[26px] font-bold tracking-[0.24em] text-gold">杉の泉</span>
          <span className="text-xs text-mute">運命を、あなたの味方に</span>
        </div>

        <form
          className="mt-9 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs text-lav">メールアドレス / ログインID</label>
            <input id="email" autoComplete="username" value={id} onChange={(e) => setId(e.target.value)} placeholder="name@example.com" className={`${inputCls} h-[50px] rounded-[14px] px-4`} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pw" className="text-xs text-lav">パスワード</label>
            <input id="pw" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="8文字以上" className={`${inputCls} h-[50px] rounded-[14px] px-4`} />
          </div>
          {error && <p className="text-xs text-rose">{error}</p>}
          <button type="submit" disabled={busy} className={`${btnGold} mt-1`}>
            {busy ? "確認しています" : "ログイン"}
          </button>
        </form>

        <div className="mt-7 flex items-center gap-3">
          <span className="h-px flex-1 bg-[#2E2754]" />
          <span className="text-xs text-dim">はじめての方</span>
          <span className="h-px flex-1 bg-[#2E2754]" />
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-[18px] border border-line bg-card p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-deep text-gold">
              <IGift />
            </span>
            <div>
              <div className="text-sm font-bold">会員登録で {settings.signupBonus.toLocaleString()}pt プレゼント</div>
              <div className="mt-0.5 text-xs text-mute">登録後すぐに鑑定をお試しいただけます</div>
            </div>
          </div>
          <Link href="/register" className="flex h-12 items-center justify-center rounded-xl border border-gold text-[15px] font-bold text-gold">
            無料で会員登録
          </Link>
        </div>

        <p className="mt-8 text-center text-[11px] text-dim">
          ログインすると <Link href="/legal/terms" className="text-lav underline">利用規約</Link> に同意したものとみなします
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, useGuard } from "@/lib/store";
import { BackHeader, Loading, Screen, btnGold, inputCls } from "@/components/ui";

export default function EditProfile() {
  const ok = useGuard("user");
  const router = useRouter();
  const { user, saveUser } = useApp();
  const [f, setF] = useState<{ name: string; birthday: string; birthTime: string; gender: string; bloodType: string } | null>(null);
  if (!ok || !user) return <Screen><Loading /></Screen>;
  const v = f ?? { name: user.name, birthday: user.birthday, birthTime: user.birthTime ?? "", gender: user.gender, bloodType: user.bloodType };
  const set = (k: keyof typeof v, val: string) => setF({ ...v, [k]: val });

  const choice = (k: "gender" | "bloodType", opts: [string, string][], cols: string) => (
    <div className={`grid ${cols} gap-1.5`}>
      {opts.map(([val, label]) => (
        <button key={val} onClick={() => set(k, val)} className={`h-11 rounded-xl border text-sm font-medium ${v[k] === val ? "border-gold bg-gold text-ink" : "border-edge bg-card text-soft"}`}>
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <Screen
      bottom={
        <button
          onClick={async () => {
            await saveUser(v);
            router.replace("/mypage");
          }}
          className={`${btnGold} w-full`}
        >
          保存する
        </button>
      }
    >
      <BackHeader title="登録情報の編集" href="/mypage" />
      <div className="flex flex-col gap-3.5 px-6 pb-6">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="nm" className="text-xs text-lav">お名前</label>
          <input id="nm" value={v.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="bd" className="text-xs text-lav">生年月日</label>
            <input id="bd" type="date" value={v.birthday} onChange={(e) => set("birthday", e.target.value)} className={`${inputCls} [color-scheme:dark]`} />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="bt" className="text-xs text-lav">出生時間</label>
            <input id="bt" type="time" value={v.birthTime} onChange={(e) => set("birthTime", e.target.value)} className={`${inputCls} [color-scheme:dark]`} />
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
        <p className="text-[11px] text-dim">メールアドレス: {user.email}</p>
      </div>
    </Screen>
  );
}

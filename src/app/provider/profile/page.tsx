"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useProviderMe } from "@/lib/useProviderMe";
import { IPen } from "@/components/icons";
import { BackHeader, Loading, Screen, btnGold } from "@/components/ui";

const STYLES = ["ゆったり", "寄り添い", "初心者歓迎", "具体的", "テンポが良い", "辛口", "本格派", "ユーモア"];

async function toThumb(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = url;
  });
  const size = 600;
  const s = Math.min(img.width, img.height);
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  c.getContext("2d")!.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
  URL.revokeObjectURL(url);
  return c.toDataURL("image/jpeg", 0.82);
}

export default function ProviderProfile() {
  const { ok, me, app } = useProviderMe();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [bio, setBio] = useState<string | null>(null);
  const [styles, setStyles] = useState<string[] | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!ok || !me) return <Screen><Loading /></Screen>;

  const b = bio ?? me.bio;
  const st = styles ?? me.styleTags;
  const ph = photo ?? me.photo;

  async function save() {
    if (!me) return;
    setBusy(true);
    const err = await app.saveProvider(me.id, { bio: b, styleTags: st, photo: ph });
    setBusy(false);
    if (err) setError(err);
    else router.replace("/provider");
  }

  return (
    <Screen bottom={<button onClick={save} disabled={busy} className={`${btnGold} w-full`}>{busy ? "保存しています" : "保存する"}</button>}>
      <BackHeader title="プロフィール編集" href="/provider" />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (f) setPhoto(await toThumb(f));
      }} />
      <div className="mx-4 flex items-center gap-3.5">
        <button onClick={() => fileRef.current?.click()} className="relative" aria-label="写真を変更">
          <img src={ph} alt="" className="h-[84px] w-[84px] rounded-[20px] object-cover" />
          <span className="absolute -bottom-1.5 -right-1.5 flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-night bg-gold text-ink">
            <IPen />
          </span>
        </button>
        <div>
          <div className="text-[17px] font-bold">{me.name}</div>
          <div className="mt-0.5 text-xs text-mute">写真はタップで変更できます</div>
        </div>
      </div>

      <div className="mx-4 mt-[18px] flex flex-col gap-1.5">
        <div className="flex justify-between">
          <label htmlFor="bio" className="text-[13px] text-lav">自己紹介</label>
          <span className="text-[11px] text-dim">{b.length} / 400</span>
        </div>
        <textarea id="bio" rows={6} maxLength={400} value={b} onChange={(e) => setBio(e.target.value)} className="resize-none rounded-[14px] border border-edge bg-card px-3.5 py-3 text-sm leading-[1.7] outline-none focus:border-gold" />
      </div>

      <div className="mx-4 mt-4">
        <div className="mb-2 text-[13px] text-lav">鑑定スタイル(3つまで)</div>
        <div className="flex flex-wrap gap-1.5">
          {STYLES.map((l) => {
            const on = st.includes(l);
            return (
              <button key={l} onClick={() => setStyles(on ? st.filter((x) => x !== l) : st.length < 3 ? [...st, l] : st)} className={`h-[34px] rounded-full border px-3.5 text-[13px] ${on ? "border-gold bg-gold text-ink" : "border-edge text-soft"}`}>
                {l}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-4 mb-6 mt-4 rounded-[14px] bg-card px-3.5 py-3 text-xs leading-[1.7] text-mute">
        料金(メッセージ {me.chatRate}pt/字 ・ ビデオ {me.callRate}pt/分 ・ 音声 {me.voiceRate}pt/分)とログイン情報は運営が設定しています。変更は運営までご連絡ください。
      </div>
      {error && <p className="mx-4 text-xs text-rose">{error}</p>}
    </Screen>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp, useGuard } from "@/lib/store";
import { list } from "@/lib/db";
import type { Review } from "@/lib/types";
import { IBack, IHeart } from "@/components/icons";
import { Loading, Screen, Stars } from "@/components/ui";

export default function TellerDetail() {
  const ok = useGuard("user");
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { providers, user, toggleFavorite } = useApp();
  const [reviews, setReviews] = useState<Review[]>([]);
  const p = providers.find((x) => x.id === id);

  useEffect(() => {
    list<Review>("reviews", { providerId: id }).then((r) => setReviews(r.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)));
  }, [id]);

  if (!ok || !user) return <Screen><Loading /></Screen>;
  if (!p) return <Screen><Loading label="先生が見つかりません" /></Screen>;
  const fav = user.favorites?.includes(p.id);
  const statusLabel = p.status === "available" ? "今すぐ話せます" : p.status === "busy" ? "鑑定中です" : "休止中です";

  return (
    <Screen
      bottom={
        <div className="flex gap-2">
          <Link href={`/messages/${p.id}`} className="flex h-[52px] flex-1 items-center justify-center rounded-[14px] border border-gold text-[15px] font-bold text-gold">
            メッセージで相談
          </Link>
          <Link href={`/booking/${p.id}`} className="flex h-[52px] flex-1 items-center justify-center rounded-[14px] bg-gold text-[15px] font-bold text-ink">
            通話を予約する
          </Link>
        </div>
      }
    >
      <div className="relative h-[320px] w-full bg-deep">
        <img src={p.photo} alt={p.name} className="h-full w-full object-cover" />
        <button onClick={() => router.back()} aria-label="戻る" className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-night text-text">
          <IBack />
        </button>
        <button
          onClick={() => toggleFavorite(p.id)}
          aria-label={fav ? "お気に入りから外す" : "お気に入りに追加"}
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-night text-gold"
        >
          <IHeart filled={fav} />
        </button>
      </div>

      <div className="relative -mt-7 flex flex-col gap-3.5 rounded-t-3xl bg-night px-5 pb-8 pt-5">
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-mincho text-[26px] font-bold tracking-wide">{p.name}</h1>
          <span
            className={`flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium ${
              p.status === "available" ? "bg-[#1F3A33] text-mint-hi" : p.status === "busy" ? "bg-[#3A2F18] text-gold-hi" : "bg-deep text-mute"
            }`}
          >
            <span className={`h-[7px] w-[7px] rounded-full ${p.status === "available" ? "bg-mint" : p.status === "busy" ? "bg-gold" : "bg-faint"}`} />
            {statusLabel}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[p.tag, ...p.styleTags].map((t) => (
            <span key={t} className="flex h-[26px] items-center rounded-full border border-edge px-2.5 text-xs text-lav">{t}</span>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-card py-2.5 text-center">
            <div className="text-lg font-bold text-gold">{p.rating}</div>
            <div className="text-[11px] text-mute">評価</div>
          </div>
          <div className="rounded-xl bg-card py-2.5 text-center">
            <div className="text-lg font-bold">{p.reviewCount.toLocaleString()}</div>
            <div className="text-[11px] text-mute">鑑定数</div>
          </div>
          <div className="rounded-xl bg-card py-2.5 text-center">
            <div className="text-lg font-bold">{p.isAI ? "24h" : `${p.careerYears ?? 0}年`}</div>
            <div className="text-[11px] text-mute">{p.isAI ? "対応" : "鑑定歴"}</div>
          </div>
        </div>

        <div>
          <div className="mb-2 text-[13px] font-medium text-lav">相談方法と料金</div>
          <div className="flex flex-col gap-1.5">
            {[
              ["メッセージ", `${p.chatRate}pt / 1文字`],
              ["ビデオ通話", `${p.callRate}pt / 1分`],
              ["音声通話(顔出しなし)", `${p.voiceRate}pt / 1分`],
            ].map(([a, b]) => (
              <div key={a} className="flex h-11 items-center justify-between rounded-xl border border-line px-3.5 text-sm">
                <span>{a}</span>
                <span className="font-bold">{b}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="whitespace-pre-wrap text-[13px] leading-[1.8] text-soft">{p.bio || "プロフィールは準備中です。"}</p>

        <div>
          <div className="mb-2 text-[13px] font-medium text-lav">感謝の声</div>
          {reviews.length === 0 && <p className="text-xs text-mute">まだ感謝の声はありません</p>}
          <div className="flex flex-col gap-2">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-xl bg-card p-3">
                <div className="flex items-center gap-2">
                  <Stars value={r.rating} size={12} />
                  <span className="text-[11px] text-mute">{r.userName.charAt(0)}** さん</span>
                </div>
                {r.tags.length > 0 && <div className="mt-1 text-[11px] text-gold">{r.tags.join(" ・ ")}</div>}
                {r.text && <p className="mt-1 text-xs leading-relaxed text-soft">{r.text}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Screen>
  );
}

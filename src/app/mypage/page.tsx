"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp, useGuard } from "@/lib/store";
import { fmtBirth, fmtPt, zodiacOf } from "@/lib/db";
import { IBag, ICardPay, IClock, IPalm } from "@/components/icons";
import { Loading, Screen } from "@/components/ui";

export default function MyPage() {
  const ok = useGuard("user");
  const router = useRouter();
  const { user, providers, logout } = useApp();
  if (!ok || !user) return <Screen nav="mypage"><Loading /></Screen>;
  const favs = providers.filter((p) => user.favorites?.includes(p.id));
  const menu: [string, string, React.ReactNode][] = [
    ["/history", "予約・利用履歴", <IClock key="c" size={20} className="text-gold" />],
    ["/history?palm", "AI手相の記録", <IPalm key="p" size={20} className="text-gold" />],
    ["/goods", "開運グッズ", <IBag key="b" size={20} className="text-gold" />],
    ["/points", "ポイント購入", <ICardPay key="k" size={20} className="text-gold" />],
  ];

  return (
    <Screen nav="mypage">
      <div className="flex h-[60px] items-center px-5">
        <span className="font-mincho text-xl font-bold">マイページ</span>
      </div>

      <div className="mx-4 flex flex-col gap-3.5 rounded-[20px] border border-line bg-card p-4">
        <div className="flex items-center gap-3.5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gold bg-deep font-mincho text-[22px] font-bold text-gold">{user.name.charAt(0)}</span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[17px] font-bold">{user.name} さん</div>
            <div className="mt-0.5 text-xs text-mute">
              {fmtBirth(user.birthday)} ・ {zodiacOf(user.birthday)} ・ {user.bloodType === "?" ? "血液型不明" : `${user.bloodType}型`}
            </div>
          </div>
          <Link href="/mypage/edit" className="text-xs text-gold">編集</Link>
        </div>
        <div className="flex items-center justify-between rounded-[14px] bg-night px-3.5 py-3">
          <div>
            <div className="text-[11px] text-mute">保有ポイント</div>
            <div className="mt-0.5 text-2xl font-bold text-gold">
              {user.points.toLocaleString()}
              <span className="ml-1 text-[13px]">pt</span>
            </div>
          </div>
          <Link href="/points" className="flex h-10 items-center rounded-full bg-gold px-[18px] text-sm font-bold text-ink">購入する</Link>
        </div>
      </div>

      <div className="mx-5 mb-2 mt-[18px] text-[13px] font-medium text-lav">お気に入りの先生</div>
      {favs.length === 0 ? (
        <p className="mx-5 text-xs text-mute">先生の詳細ページのハートから登録できます</p>
      ) : (
        <div className="no-scrollbar mx-5 flex gap-3.5 overflow-x-auto">
          {favs.map((p) => (
            <Link key={p.id} href={`/tellers/${p.id}`} className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-[11px] text-text">
              <img src={p.photo} alt="" className={`h-14 w-14 rounded-full border-2 object-cover ${p.status === "available" ? "border-mint" : p.status === "busy" ? "border-gold" : "border-edge"}`} />
              <span className="w-full truncate text-center">{p.name.replace(/\(.*\)/, "")}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="mx-4 mt-[18px] overflow-hidden rounded-[18px] border border-line bg-card">
        {menu.map(([href, label, icon], i) => (
          <Link key={label} href={href} className={`flex h-[50px] items-center gap-3 px-4 text-sm text-text ${i < menu.length - 1 ? "border-b border-deep" : ""}`}>
            {icon}
            <span className="flex-1">{label}</span>
            <span className="text-faint">›</span>
          </Link>
        ))}
      </div>

      <div className="mx-5 mt-3.5 flex flex-wrap gap-x-4 gap-y-1.5 pb-8 text-xs">
        <Link href="/legal/terms" className="text-mute">利用規約</Link>
        <Link href="/legal/privacy" className="text-mute">プライバシーポリシー</Link>
        <Link href="/legal/tokushoho" className="text-mute">特定商取引法に基づく表記</Link>
        <button
          onClick={() => {
            logout();
            router.replace("/login");
          }}
          className="text-rose"
        >
          ログアウト
        </button>
      </div>
    </Screen>
  );
}

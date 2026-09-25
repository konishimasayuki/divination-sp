"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useApp, useGuard } from "@/lib/store";
import { IClose, IMenu } from "./icons";
import { Loading } from "./ui";

const MENU = [
  ["/admin", "ダッシュボード"],
  ["/admin/tellers", "占い師管理"],
  ["/admin/users", "会員管理"],
  ["/admin/payout", "売上・出金"],
  ["/admin/bookings", "予約・鑑定ログ"],
  ["/admin/orders", "グッズ・注文"],
  ["/admin/settings", "API・料金設定"],
  ["/admin/video-test", "ビデオテスト"],
] as const;

export function AdminShell({ title, sub, actions, children }: { title: string; sub?: string; actions?: ReactNode; children: ReactNode }) {
  const ok = useGuard("admin");
  const { logout } = useApp();
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <>
      <div className="flex items-center gap-2.5 px-1.5 pb-5">
        <img src="/home-icon.png" alt="" className="h-[34px] w-[34px] object-contain" />
        <div>
          <div className="font-mincho text-[17px] font-bold tracking-[0.08em] text-gold">杉の泉</div>
          <div className="text-[11px] text-dim">管理者</div>
        </div>
      </div>
      {MENU.map(([href, label]) => {
        const on = path === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex h-10 items-center rounded-[10px] px-3 text-sm ${on ? "bg-deep font-bold text-text" : "text-lav hover:bg-card hover:text-text"}`}
          >
            {label}
          </Link>
        );
      })}
      <div className="flex-1" />
      <button
        onClick={() => {
          logout();
          router.replace("/login");
        }}
        className="flex h-10 items-center rounded-[10px] px-3 text-sm text-rose hover:bg-card"
      >
        ログアウト
      </button>
    </>
  );

  if (!ok) return <div className="min-h-[100dvh] bg-[#100C22]"><Loading /></div>;

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#100C22]">
      <aside className="hidden w-60 shrink-0 flex-col gap-1 border-r border-[#251F45] bg-night px-3.5 py-5 lg:flex">{nav}</aside>

      {open && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <aside className="flex w-64 flex-col gap-1 bg-night px-3.5 py-5" style={{ paddingTop: "calc(env(safe-area-inset-top) + 20px)" }}>
            <button onClick={() => setOpen(false)} aria-label="メニューを閉じる" className="mb-2 flex h-9 w-9 items-center justify-center self-end text-lav">
              <IClose />
            </button>
            {nav}
          </aside>
          <button aria-label="メニューを閉じる" onClick={() => setOpen(false)} className="flex-1 bg-black/50" />
        </div>
      )}

      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="flex items-center justify-between gap-3 px-4 pb-4 pt-5 lg:px-8 lg:pt-6" style={{ paddingTop: "calc(env(safe-area-inset-top) + 20px)" }}>
          <div className="flex min-w-0 items-center gap-2">
            <button onClick={() => setOpen(true)} aria-label="メニュー" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-text lg:hidden">
              <IMenu />
            </button>
            <div className="min-w-0">
              <h1 className="truncate font-mincho text-[22px] font-bold lg:text-[26px]">{title}</h1>
              {sub && <div className="mt-1 text-[13px] text-mute">{sub}</div>}
            </div>
          </div>
          {actions}
        </div>
        <div className="flex-1 px-4 pb-10 lg:px-8">{children}</div>
      </main>
    </div>
  );
}

export const panel = "rounded-2xl border border-deep bg-panel p-4 lg:p-5";

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { IBack, IBag, IMsg, IPalm, IUser } from "./icons";

export type NavKey = "home" | "messages" | "goods" | "palm" | "mypage";

// スマホ1画面分の枠。本文だけスクロールし、下部ナビ・固定バーは画面に固定
export function Screen({
  children,
  nav,
  bottom,
  dark,
  className = "",
}: {
  children: ReactNode;
  nav?: NavKey;
  bottom?: ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex h-[100dvh] justify-center overflow-hidden ${dark ? "bg-abyss" : "bg-night"}`}>
      <div
        className={`relative flex h-full w-full max-w-[430px] flex-col ${dark ? "bg-abyss" : "bg-night"}`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className={`no-scrollbar flex-1 overflow-y-auto ${className}`}>{children}</div>
        {bottom && (
          <div
            className="shrink-0 border-t border-[#2E2754] bg-[#1A1533] px-4 pt-3"
            style={{ paddingBottom: nav ? 12 : "calc(env(safe-area-inset-bottom) + 16px)" }}
          >
            {bottom}
          </div>
        )}
        {nav && <BottomNav active={nav} />}
      </div>
    </div>
  );
}

export function BottomNav({ active }: { active: NavKey }) {
  const item = (key: NavKey, href: string, label: string, icon: ReactNode) => (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 text-[10px] ${active === key ? "font-bold text-gold" : "text-mute"}`}
    >
      {icon}
      {label}
    </Link>
  );
  return (
    <nav
      className="grid shrink-0 grid-cols-5 items-start border-t border-[#2E2754] bg-[#1A1533] pt-2.5"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)" }}
    >
      {item("messages", "/messages", "メッセージ", <IMsg strokeWidth={active === "messages" ? 1.9 : 1.6} />)}
      {item("goods", "/goods", "グッズ", <IBag strokeWidth={active === "goods" ? 1.9 : 1.6} />)}
      <Link href="/home" aria-label="ホーム" className="flex justify-center">
        <span
          className={`-mt-8 flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-night bg-deep ${
            active === "home" ? "shadow-[0_0_0_2px_#D9A04A]" : "shadow-[0_0_0_1px_#D9A04A]"
          }`}
        >
          <img src="/home-icon.png" alt="" className="h-[52px] w-[52px] max-w-none object-contain" />
        </span>
      </Link>
      {item("palm", "/palm", "AI手相", <IPalm strokeWidth={active === "palm" ? 1.9 : 1.6} />)}
      {item("mypage", "/mypage", "マイページ", <IUser strokeWidth={active === "mypage" ? 1.9 : 1.6} />)}
    </nav>
  );
}

export function BackHeader({
  title,
  href,
  right,
  children,
}: {
  title?: string;
  href?: string;
  right?: ReactNode;
  children?: ReactNode;
}) {
  const router = useRouter();
  return (
    <div className="flex h-[60px] shrink-0 items-center justify-between px-3">
      <div className="flex min-w-0 items-center gap-1">
        <button
          onClick={() => (href ? router.push(href) : router.back())}
          aria-label="戻る"
          className="flex h-11 w-11 items-center justify-center text-text"
        >
          <IBack />
        </button>
        {children}
        {title && <span className="truncate font-mincho text-lg font-bold">{title}</span>}
      </div>
      {right}
    </div>
  );
}

export function Chip({ on, onClick, children, className = "" }: { on: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`h-[34px] shrink-0 rounded-full border px-3.5 text-xs font-medium ${
        on ? "border-gold bg-gold text-ink" : "border-edge bg-transparent text-lav"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="flex gap-0.5 text-gold">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24" fill={n <= Math.round(value) ? "currentColor" : "none"} stroke={n <= Math.round(value) ? "currentColor" : "#6B6194"} strokeWidth={1.6} aria-hidden>
          <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z" />
        </svg>
      ))}
    </span>
  );
}

export function StatusBadge({ status }: { status: "available" | "busy" | "off" }) {
  const map = {
    available: { label: "待機中", dot: "bg-mint" },
    busy: { label: "鑑定中", dot: "bg-gold" },
    off: { label: "休止中", dot: "bg-faint" },
  }[status];
  return (
    <span className="flex h-[22px] items-center gap-1.5 rounded-full bg-night px-2 text-[11px] text-text">
      <span className={`h-[7px] w-[7px] rounded-full ${map.dot}`} />
      {map.label}
    </span>
  );
}

export function Avatar({ src, name, size = 52, ai }: { src?: string; name: string; size?: number; ai?: boolean }) {
  if (src) {
    return <img src={src} alt="" style={{ width: size, height: size }} className="shrink-0 rounded-full object-cover" />;
  }
  return (
    <span
      style={{ width: size, height: size }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-deep font-mincho font-bold ${ai ? "border border-gold text-gold" : "text-lav"}`}
    >
      {ai ? "AI" : name.charAt(0)}
    </span>
  );
}

export function Loading({ label = "読み込み中" }: { label?: string }) {
  return <div className="py-16 text-center text-sm text-mute">{label}…</div>;
}

export const btnGold =
  "flex h-[54px] items-center justify-center rounded-2xl bg-gold text-base font-bold text-ink disabled:opacity-40";
export const btnLine =
  "flex h-12 items-center justify-center rounded-xl border border-gold text-[15px] font-bold text-gold";
export const inputCls =
  "h-12 w-full rounded-xl border border-edge bg-card px-3.5 text-[15px] text-text outline-none focus:border-gold";
export const cardCls = "rounded-2xl border border-line bg-card";

export function displayName(name: string) {
  return name.replace(/\((AI・)?デモ\)/, "");
}

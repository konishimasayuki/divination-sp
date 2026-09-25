"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp, useGuard } from "@/lib/store";
import { PRODUCT_CATEGORIES, products, productMap } from "@/lib/products";
import { fmtPt } from "@/lib/db";
import { ICart } from "@/components/icons";
import { Chip, Loading, Screen } from "@/components/ui";

export default function Goods() {
  const ok = useGuard("user");
  const { cart, providers } = useApp();
  const [cat, setCat] = useState("すべて");
  if (!ok) return <Screen nav="goods"><Loading /></Screen>;
  const count = cart.reduce((s, c) => s + c.qty, 0);
  const rows = products.filter((p) => cat === "すべて" || p.category === cat);
  const pick = productMap.pr1;
  const sup = providers.find((p) => p.id === pick.supervisor);

  return (
    <Screen nav="goods">
      <div className="flex h-[60px] items-center justify-between pl-5 pr-3">
        <span className="font-mincho text-xl font-bold">開運グッズ</span>
        <Link href="/cart" aria-label={`カート(${count}点)`} className="relative flex h-11 w-11 items-center justify-center text-text">
          <ICart />
          {count > 0 && <span className="absolute right-1 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-ink">{count}</span>}
        </Link>
      </div>

      <Link href={`/goods/${pick.id}`} className="mx-4 flex h-24 items-center gap-3.5 overflow-hidden rounded-[18px] border border-line bg-card pr-3.5 text-text">
        <img src={pick.image} alt="" className="h-24 w-[110px] object-cover" />
        <div className="min-w-0">
          <div className="text-[11px] font-bold text-gold">先生が選んだ今月の石</div>
          <div className="mt-1 truncate font-mincho text-base font-bold">心を整える、紫水晶</div>
          <div className="mt-1 text-xs text-mute">{sup ? `${sup.name} 監修` : ""}</div>
        </div>
      </Link>

      <div className="no-scrollbar mt-4 flex gap-1.5 overflow-x-auto px-4">
        {PRODUCT_CATEGORIES.map((c) => (
          <Chip key={c} on={cat === c} onClick={() => setCat(c)}>{c}</Chip>
        ))}
      </div>

      <div className="mx-4 mt-4 grid grid-cols-2 gap-3 pb-6">
        {rows.map((p) => (
          <Link key={p.id} href={`/goods/${p.id}`} className="text-text">
            <img src={p.image} alt={p.name} className="block h-[150px] w-full rounded-2xl object-cover" />
            <div className="mt-2 line-clamp-2 text-[13px] font-medium leading-snug">{p.name}</div>
            <div className="mt-1 text-sm font-bold text-gold">{fmtPt(p.points)}</div>
          </Link>
        ))}
      </div>
    </Screen>
  );
}

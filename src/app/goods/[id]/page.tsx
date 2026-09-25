"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp, useGuard } from "@/lib/store";
import { productMap } from "@/lib/products";
import { fmtPt } from "@/lib/db";
import { IBack, ICart } from "@/components/icons";
import { Loading, Screen } from "@/components/ui";

export default function GoodsDetail() {
  const ok = useGuard("user");
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { providers, addToCart, cart } = useApp();
  const [qty, setQty] = useState(1);
  const p = productMap[id];
  if (!ok) return <Screen><Loading /></Screen>;
  if (!p) return <Screen><Loading label="商品が見つかりません" /></Screen>;
  const sup = providers.find((x) => x.id === p.supervisor);
  const count = cart.reduce((s, c) => s + c.qty, 0);

  return (
    <Screen
      bottom={
        <div className="flex items-center gap-2.5">
          <div className="flex h-[52px] items-center rounded-[14px] border border-edge">
            <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="数量を減らす" className="h-[50px] w-11 text-xl">−</button>
            <span className="w-6 text-center font-bold">{qty}</span>
            <button onClick={() => setQty(Math.min(9, qty + 1))} aria-label="数量を増やす" className="h-[50px] w-11 text-xl">+</button>
          </div>
          <button
            onClick={() => {
              addToCart(p.id, qty);
              router.push("/cart");
            }}
            className="flex h-[52px] flex-1 items-center justify-center rounded-[14px] bg-gold text-[15px] font-bold text-ink"
          >
            カートに入れる ・ {fmtPt(p.points * qty)}
          </button>
        </div>
      }
    >
      <div className="relative h-[360px] w-full bg-card">
        <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
        <button onClick={() => router.back()} aria-label="戻る" className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-night text-text">
          <IBack />
        </button>
        <Link href="/cart" aria-label="カート" className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-night text-text">
          <ICart size={20} />
          {count > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-ink">{count}</span>}
        </Link>
      </div>
      <div className="relative -mt-6 flex flex-col gap-3 rounded-t-3xl bg-night px-5 pb-8 pt-[22px]">
        <span className="flex h-6 items-center self-start rounded-full border border-edge px-2.5 text-[11px] text-lav">{p.category}</span>
        <h1 className="font-mincho text-[22px] font-bold leading-snug">{p.name}</h1>
        <div className="text-2xl font-bold text-gold">{fmtPt(p.points)}</div>
        {sup && (
          <Link href={`/tellers/${sup.id}`} className="flex items-center gap-2.5 rounded-[14px] bg-card px-3 py-2.5 text-text">
            <img src={sup.photo} alt="" className="h-9 w-9 rounded-full object-cover" />
            <div className="flex-1">
              <div className="text-[13px] font-bold">{sup.name} 監修</div>
              <div className="text-[11px] text-mute">鑑定で実際におすすめしているアイテムです</div>
            </div>
            <span className="text-faint">›</span>
          </Link>
        )}
        <p className="text-[13px] leading-[1.8] text-soft">{p.desc}</p>
        <p className="text-[11px] text-dim">※ デモ商品のため、実際の発送は行われません</p>
      </div>
    </Screen>
  );
}

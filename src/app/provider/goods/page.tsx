"use client";

import { useEffect, useRef, useState } from "react";
import { useProviderMe } from "@/lib/useProviderMe";
import { CATEGORY_OPTIONS, type Product } from "@/lib/products";
import { fmtDate, fmtPt, list } from "@/lib/db";
import { uploadImage } from "@/lib/upload";
import type { Order, User } from "@/lib/types";
import { IPen } from "@/components/icons";
import { BackHeader, Chip, Loading, Screen, btnGold, inputCls } from "@/components/ui";

type Form = { name: string; category: string; points: string; stock: string; desc: string; image: string; published: boolean };
const empty: Form = { name: "", category: CATEGORY_OPTIONS[0], points: "", stock: "", desc: "", image: "", published: true };

export default function ProviderGoods() {
  const { ok, me, app } = useProviderMe();
  const [tab, setTab] = useState<"items" | "orders">("items");
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [f, setF] = useState<Form>(empty);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<(Order & { address?: string })[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (tab !== "orders") return;
    list<Order & { address?: string }>("orders").then((o) => setOrders(o.sort((a, b) => b.createdAt - a.createdAt)));
    list<User>("users").then(setUsers);
  }, [tab]);

  if (!ok || !me) return <Screen><Loading /></Screen>;
  const mine = app.products.filter((p) => p.providerId === me.id && (!p.deleted || p.removedByAdmin));
  const mineIds = new Set(mine.map((p) => p.id));
  const myOrders = orders.filter((o) => o.items.some((it) => mineIds.has(it.productId)));
  const set = (k: keyof Form, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  function open(p?: Product) {
    setError("");
    if (!p) {
      setEditing("new");
      setF(empty);
      return;
    }
    setEditing(p.id);
    setF({ name: p.name, category: p.category, points: String(p.points), stock: p.stock == null ? "" : String(p.stock), desc: p.desc, image: p.image, published: p.published !== false });
  }

  async function save() {
    if (!me) return;
    const points = Number(f.points.replace(/[^\d]/g, ""));
    if (!f.name.trim() || !points || !f.image) {
      setError("写真・商品名・価格は必須です");
      return;
    }
    setBusy(true);
    const data: Partial<Product> = {
      name: f.name.trim(),
      category: f.category,
      points,
      stock: f.stock.trim() === "" ? null : Math.max(0, Number(f.stock.replace(/[^\d]/g, "")) || 0),
      desc: f.desc.trim(),
      image: f.image,
      published: f.published,
      providerId: me.id,
    };
    if (editing === "new") await app.addProduct(data);
    else if (editing) await app.saveProduct(editing, data);
    setBusy(false);
    setEditing(null);
  }

  async function remove() {
    if (!editing || editing === "new") return;
    if (!confirm("この商品を削除しますか?(お客様の画面からも消えます)")) return;
    await app.saveProduct(editing, { deleted: true, published: false });
    setEditing(null);
  }

  // ---- 登録・編集フォーム ----
  if (editing) {
    return (
      <Screen
        bottom={
          <div className="flex gap-2">
            {editing !== "new" && (
              <button onClick={remove} className="h-[54px] shrink-0 rounded-2xl border border-rose px-4 text-sm font-bold text-rose">削除</button>
            )}
            <button onClick={save} disabled={busy || uploading} className={`${btnGold} flex-1`}>
              {busy ? "保存しています" : editing === "new" ? "登録する" : "保存する"}
            </button>
          </div>
        }
      >
        <BackHeader title={editing === "new" ? "商品を登録" : "商品を編集"} href="/provider/goods" />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setUploading(true);
            set("image", await uploadImage(file, { max: 900, square: true }));
            setUploading(false);
          }}
        />
        <div className="flex flex-col gap-4 px-4 pb-6">
          <button onClick={() => fileRef.current?.click()} className="relative mx-auto flex h-52 w-52 items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-edge bg-card" aria-label="商品の写真を選ぶ">
            {f.image ? <img src={f.image} alt="" className="h-full w-full object-cover" /> : <span className="text-sm text-lav">{uploading ? "アップロード中…" : "タップして写真を選ぶ"}</span>}
            {f.image && (
              <span className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-gold text-ink">
                <IPen />
              </span>
            )}
          </button>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pn" className="text-xs text-lav">商品名</label>
            <input id="pn" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="例:恋愛成就のローズクォーツ" className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-lav">カテゴリ</span>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_OPTIONS.map((c) => (
                <Chip key={c} on={f.category === c} onClick={() => set("category", c)}>{c}</Chip>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pp" className="text-xs text-lav">価格(pt)</label>
              <input id="pp" inputMode="numeric" value={f.points} onChange={(e) => set("points", e.target.value)} placeholder="3000" className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ps" className="text-xs text-lav">在庫数(空欄=制限なし)</label>
              <input id="ps" inputMode="numeric" value={f.stock} onChange={(e) => set("stock", e.target.value)} placeholder="制限なし" className={inputCls} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pd" className="text-xs text-lav">説明</label>
            <textarea id="pd" rows={5} value={f.desc} onChange={(e) => set("desc", e.target.value)} placeholder="意味・おすすめの使い方・サイズなど" className="resize-none rounded-[14px] border border-edge bg-card px-3.5 py-3 text-sm leading-relaxed outline-none focus:border-gold" />
          </div>
          <button onClick={() => set("published", !f.published)} className="flex items-center justify-between rounded-[14px] bg-card px-3.5 py-3">
            <div className="text-left">
              <div className="text-[13px] font-bold">お客様に公開する</div>
              <div className="mt-0.5 text-[11px] text-mute">オフにすると、グッズの一覧に表示されません</div>
            </div>
            <span className={`relative h-[30px] w-[52px] shrink-0 rounded-full ${f.published ? "bg-gold" : "bg-edge"}`}>
              <span className="absolute top-[3px] h-6 w-6 rounded-full bg-text" style={{ left: f.published ? 25 : 3 }} />
            </span>
          </button>
          {editing !== "new" && app.products.find((x) => x.id === editing)?.suspended && (
            <p className="rounded-xl bg-[#3A2F18] px-3 py-2.5 text-xs leading-relaxed text-gold-hi">この商品は運営が公開を停止しています。内容を直したら、運営にご連絡ください。</p>
          )}
          <p className="text-[11px] text-dim">お客様の画面では「{me.name} 監修」と表示されます。</p>
          {error && <p className="text-xs text-rose">{error}</p>}
        </div>
      </Screen>
    );
  }

  // ---- 一覧 ----
  return (
    <Screen bottom={tab === "items" ? <button onClick={() => open()} className={`${btnGold} w-full`}>+ 商品を登録する</button> : undefined}>
      <BackHeader title="開運グッズ" href="/provider" />
      <div className="mx-4 grid grid-cols-2 gap-1.5">
        <Chip on={tab === "items"} onClick={() => setTab("items")}>自分の商品({mine.length})</Chip>
        <Chip on={tab === "orders"} onClick={() => setTab("orders")}>注文</Chip>
      </div>

      {tab === "items" ? (
        <div className="mx-4 mt-4 flex flex-col gap-2.5 pb-6">
          {mine.length === 0 && <p className="rounded-2xl bg-card p-6 text-center text-sm leading-relaxed text-mute">まだ商品がありません。<br />下のボタンから登録できます。</p>}
          {mine.map((p) => (
            <button key={p.id} disabled={!!p.deleted} onClick={() => open(p)} className={`flex items-center gap-3 rounded-2xl border bg-card p-3 text-left text-text ${p.deleted ? "border-[#5A2A33] opacity-80" : "border-line"}`}>
              <img src={p.image} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">{p.name}</div>
                <div className="mt-0.5 text-xs text-mute">{p.category} ・ {p.stock == null ? "在庫 制限なし" : p.stock === 0 ? "売り切れ" : `在庫 ${p.stock}`}</div>
                <div className="mt-0.5 text-sm font-bold text-gold">{fmtPt(p.points)}</div>
              </div>
              {p.deleted ? (
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="rounded-full bg-[#3A1C24] px-2.5 py-1 text-[11px] font-bold text-[#F0A9B4]">運営が削除</span>
                  {p.removedReason && <span className="max-w-[120px] text-right text-[10px] leading-snug text-[#F0A9B4]">{p.removedReason}</span>}
                </span>
              ) : p.suspended ? (
                <span className="shrink-0 rounded-full bg-[#3A2F18] px-2.5 py-1 text-[11px] font-bold text-gold-hi">運営が公開停止</span>
              ) : (
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${p.published !== false ? "bg-[#1F3A33] text-mint-hi" : "bg-deep text-mute"}`}>{p.published !== false ? "公開中" : "非公開"}</span>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="mx-4 mt-4 flex flex-col gap-2.5 pb-6">
          {myOrders.length === 0 && <p className="rounded-2xl bg-card p-6 text-center text-sm text-mute">まだ注文はありません</p>}
          {myOrders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-line bg-card p-3.5">
              <div className="flex justify-between text-xs text-mute">
                <span>{fmtDate(o.createdAt)}</span>
                <span>{users.find((u) => u.id === o.userId)?.name ?? "お客様"} さん</span>
              </div>
              {o.items.filter((it) => mineIds.has(it.productId)).map((it) => (
                <div key={it.productId} className="mt-1.5 flex justify-between text-sm">
                  <span className="truncate">{app.products.find((p) => p.id === it.productId)?.name}</span>
                  <span className="shrink-0 font-bold">× {it.qty}</span>
                </div>
              ))}
              {o.address && <div className="mt-2 whitespace-pre-wrap rounded-xl bg-night px-3 py-2 text-xs leading-relaxed text-soft">{o.address}</div>}
            </div>
          ))}
        </div>
      )}
    </Screen>
  );
}

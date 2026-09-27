"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { fmtPt, list } from "@/lib/db";
import type { Product } from "@/lib/products";
import type { Order } from "@/lib/types";
import { AdminShell, panel } from "@/components/AdminShell";
import { Chip } from "@/components/ui";

type F = "all" | "live" | "private" | "suspended" | "deleted";
const REASONS = ["規約違反のため", "誇大な効果の表示があるため", "販売できない商品のため", "写真・説明が不適切なため"];

function statusOf(p: Product): F {
  if (p.deleted) return "deleted";
  if (p.suspended) return "suspended";
  if (p.published === false) return "private";
  return "live";
}
const LABEL: Record<Exclude<F, "all">, [string, string]> = {
  live: ["公開中", "bg-[#1F3A33] text-mint-hi"],
  private: ["非公開(先生)", "bg-deep text-lav"],
  suspended: ["公開停止(運営)", "bg-[#3A2F18] text-gold-hi"],
  deleted: ["削除済み", "bg-[#3A1C24] text-[#F0A9B4]"],
};

export default function AdminProducts() {
  const { products, providers, saveProduct, refreshProducts } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [q, setQ] = useState("");
  const [f, setF] = useState<F>("all");
  const [who, setWho] = useState("all");
  const [removing, setRemoving] = useState<Product | null>(null);
  const [reason, setReason] = useState(REASONS[0]);

  useEffect(() => {
    refreshProducts();
    list<Order>("orders").then(setOrders);
  }, [refreshProducts]);

  const owner = (p: Product) => providers.find((x) => x.id === p.providerId)?.name ?? "運営";
  const sold = (id: string) => orders.reduce((s, o) => s + o.items.filter((it) => it.productId === id).reduce((a, it) => a + it.qty, 0), 0);
  const rows = products
    .filter((p) => f === "all" || statusOf(p) === f)
    .filter((p) => who === "all" || (p.providerId || "") === who)
    .filter((p) => !q || p.name.includes(q) || owner(p).includes(q));
  const count = (k: F) => (k === "all" ? products.length : products.filter((p) => statusOf(p) === k).length);

  async function doRemove() {
    if (!removing) return;
    await saveProduct(removing.id, { deleted: true, removedByAdmin: true, removedReason: reason, published: false });
    setRemoving(null);
  }

  return (
    <AdminShell title="商品管理" sub={`全${products.length}点 ・ 公開中 ${count("live")}点`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label htmlFor="pq" className="sr-only">商品を検索</label>
        <input id="pq" value={q} onChange={(e) => setQ(e.target.value)} placeholder="商品名・出品者で検索" className="h-[42px] rounded-[10px] border border-edge bg-night px-3.5 text-sm outline-none focus:border-gold lg:w-72" />
        <div className="flex flex-wrap gap-2">
          {([["all", "すべて"], ["live", "公開中"], ["private", "非公開"], ["suspended", "公開停止"], ["deleted", "削除済み"]] as [F, string][]).map(([k, l]) => (
            <Chip key={k} on={f === k} onClick={() => setF(k)}>{l}({count(k)})</Chip>
          ))}
        </div>
        <label htmlFor="who" className="sr-only">出品者で絞り込み</label>
        <select id="who" value={who} onChange={(e) => setWho(e.target.value)} className="h-[42px] rounded-[10px] border border-edge bg-night px-3 text-sm text-text lg:ml-auto">
          <option value="all">出品者:すべて</option>
          <option value="">運営</option>
          {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className={`${panel} mt-4 overflow-x-auto p-0 lg:p-0`}>
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="text-xs text-dim">
            <tr className="border-b border-deep">
              <th className="px-4 py-3 font-normal">商品</th><th className="font-normal">出品者</th><th className="font-normal">カテゴリ</th><th className="text-right font-normal">価格</th><th className="text-right font-normal">在庫</th><th className="text-right font-normal">販売数</th><th className="text-center font-normal">状態</th><th className="px-4 text-right font-normal">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-mute">該当する商品はありません</td></tr>}
            {rows.map((p) => {
              const st = statusOf(p);
              return (
                <tr key={p.id} className={`border-b border-[#211B3E] ${st === "deleted" ? "opacity-60" : ""}`}>
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-3">
                      <img src={p.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                      <span className="min-w-0">
                        <span className="block max-w-[260px] truncate font-bold">{p.name}</span>
                        {p.removedReason && <span className="block text-[11px] text-[#F0A9B4]">削除理由:{p.removedReason}</span>}
                      </span>
                    </span>
                  </td>
                  <td className="text-lav">{owner(p)}</td>
                  <td className="text-lav">{p.category}</td>
                  <td className="text-right">{fmtPt(p.points)}</td>
                  <td className="text-right">{p.stock == null ? "—" : p.stock}</td>
                  <td className="text-right">{sold(p.id)}</td>
                  <td className="text-center"><span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] ${LABEL[st as Exclude<F, "all">][1]}`}>{LABEL[st as Exclude<F, "all">][0]}</span></td>
                  <td className="px-4 text-right">
                    <span className="flex justify-end gap-3 whitespace-nowrap text-xs">
                      {st !== "deleted" && <Link href={`/goods/${p.id}`} className="text-lav" target="_blank">確認</Link>}
                      {st !== "deleted" && (
                        <button onClick={() => saveProduct(p.id, { suspended: !p.suspended })} className="text-gold">{p.suspended ? "停止を解除" : "公開停止"}</button>
                      )}
                      {st !== "deleted" ? (
                        <button onClick={() => { setRemoving(p); setReason(REASONS[0]); }} className="text-rose">削除</button>
                      ) : (
                        <button onClick={() => saveProduct(p.id, { deleted: false, removedByAdmin: false, removedReason: "", published: false })} className="text-mint-hi">復元(非公開で)</button>
                      )}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2.5 text-xs text-dim">公開停止:お客様の画面から一時的に隠し、先生は再公開できません。削除:理由とともに削除し、先生の画面にも理由が表示されます。削除済みも一覧に残るので、復元できます。</p>

      {removing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className={`${panel} w-full max-w-md bg-night`}>
            <div className="font-mincho text-lg font-bold">商品を削除</div>
            <p className="mt-1 text-sm text-lav">「{removing.name}」({owner(removing)})をお客様の画面から削除します。</p>
            <div className="mt-3 text-xs text-lav">削除の理由(先生に表示されます)</div>
            <div className="mt-1.5 flex flex-col gap-1.5">
              {REASONS.map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm">
                  <input type="radio" name="rs" checked={reason === r} onChange={() => setReason(r)} className="accent-[#D9A04A]" />
                  {r}
                </label>
              ))}
              <input value={REASONS.includes(reason) ? "" : reason} onChange={(e) => setReason(e.target.value || REASONS[0])} placeholder="その他の理由を入力" className="mt-1 h-10 rounded-[10px] border border-edge bg-card px-3 text-sm outline-none focus:border-gold" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setRemoving(null)} className="h-10 rounded-[10px] border border-edge px-4 text-sm text-soft">やめる</button>
              <button onClick={doRemove} className="h-10 rounded-[10px] bg-danger px-5 text-sm font-bold text-white">削除する</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

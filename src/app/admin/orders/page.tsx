"use client";

import { useEffect, useState } from "react";
import { fmtPt, list } from "@/lib/db";
import { productMap } from "@/lib/products";
import type { Order, User } from "@/lib/types";
import { AdminShell, panel } from "@/components/AdminShell";

export default function AdminOrders() {
  const [orders, setOrders] = useState<(Order & { address?: string })[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    list<Order & { address?: string }>("orders").then((o) => setOrders(o.sort((a, b) => b.createdAt - a.createdAt)));
    list<User>("users").then(setUsers);
  }, []);

  return (
    <AdminShell title="グッズ・注文" sub={`全${orders.length}件 ・ 合計 ${fmtPt(orders.reduce((s, o) => s + o.total, 0))}`}>
      <div className={`${panel} overflow-x-auto p-0 lg:p-0`}>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs text-dim">
            <tr className="border-b border-deep">
              <th className="px-4 py-3 font-normal">注文日時</th><th className="font-normal">会員</th><th className="font-normal">商品</th><th className="font-normal">お届け先</th><th className="px-4 text-right font-normal">合計</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-mute">注文はまだありません</td></tr>}
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-[#211B3E] align-top">
                <td className="px-4 py-3">{new Date(o.createdAt).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                <td className="py-3 font-bold">{users.find((u) => u.id === o.userId)?.name ?? "-"}</td>
                <td className="py-3 text-lav">
                  {o.items.map((it) => (
                    <div key={it.productId}>{productMap[it.productId]?.name ?? it.productId} × {it.qty}</div>
                  ))}
                </td>
                <td className="max-w-[220px] whitespace-pre-wrap py-3 text-xs text-lav">{o.address ?? "-"}</td>
                <td className="px-4 py-3 text-right font-bold">{fmtPt(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

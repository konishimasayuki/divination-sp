// サーバー専用: PayPay決済の記録とポイント付与
import { assertRedis, redis } from "./redis";
import { getPayment } from "./paypay";
import { defaultSettings, type Settings } from "./types";

export type Payment = {
  id: string; // merchantPaymentId
  userId: string;
  points: number;
  price: number;
  status: string; // CREATED / COMPLETED / FAILED / CANCELED / EXPIRED
  credited?: boolean;
  paymentId?: string;
  createdAt: number;
  updatedAt?: number;
};

type Item = { id: string; [k: string]: unknown };
const key = (id: string) => `paypay:pay:${id}`;

export async function loadSettings(): Promise<Settings> {
  assertRedis();
  const items = ((await redis.get<Item[]>("col:settings")) ?? []) as Item[];
  const s = items.find((x) => x.id === "main") as Partial<Settings> | undefined;
  return { ...defaultSettings, ...(s ?? {}) };
}

export async function findUser(userId: string) {
  const users = ((await redis.get<Item[]>("col:users")) ?? []) as Item[];
  return users.find((u) => u.id === userId);
}

export async function savePayment(p: Payment) {
  await redis.set(key(p.id), p, { ex: 60 * 60 * 24 * 90 });
}

export async function getSavedPayment(id: string) {
  assertRedis();
  return (await redis.get<Payment>(key(id))) ?? null;
}

// ポイントを1回だけ付与する(リダイレクト・Webhookのどちらから呼ばれても二重付与しない)
async function credit(p: Payment) {
  const lock = await redis.set(`paypay:credited:${p.id}`, 1, { nx: true, ex: 60 * 60 * 24 * 90 });
  if (lock === null) return false;
  const users = ((await redis.get<Item[]>("col:users")) ?? []) as Item[];
  const next = users.map((u) => (u.id === p.userId ? { ...u, points: Number(u.points ?? 0) + p.points } : u));
  await redis.set("col:users", next);
  const history = ((await redis.get<Item[]>("col:history")) ?? []) as Item[];
  history.push({
    id: `hi${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
    userId: p.userId,
    kind: "buy",
    label: `ポイント購入 ${p.points.toLocaleString("ja-JP")}pt`,
    detail: `¥${p.price.toLocaleString("ja-JP")}(PayPay)`,
    points: p.points,
    createdAt: Date.now(),
  });
  await redis.set("col:history", history.length > 3000 ? history.slice(history.length - 3000) : history);
  return true;
}

// PayPayに決済状況を問い合わせ、完了していればポイントを付与する
export async function syncPayment(id: string): Promise<Payment | null> {
  const p = await getSavedPayment(id);
  if (!p) return null;
  if (p.credited) return p;
  const r = await getPayment(id);
  const next: Payment = { ...p, status: r.status, paymentId: r.paymentId ?? p.paymentId, updatedAt: Date.now() };
  if (r.status === "COMPLETED") {
    if (r.amount != null && r.amount !== p.price) {
      next.status = "AMOUNT_MISMATCH";
    } else {
      await credit(p);
      next.credited = true;
    }
  }
  await savePayment(next);
  return next;
}

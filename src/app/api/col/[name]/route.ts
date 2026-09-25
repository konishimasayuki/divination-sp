import { NextRequest, NextResponse } from "next/server";
import { assertRedis, redis } from "@/lib/redis";

// 汎用コレクションAPI(Upstash Redisに配列として保存)
// GET    /api/col/bookings?providerId=p1  → 条件に一致する配列
// POST   /api/col/bookings   body: item    → 追加したitem
// PATCH  /api/col/bookings   body: {id, updates} → 更新後のitem
const ALLOWED = ["users", "bookings", "messages", "history", "reviews", "payouts", "palm", "orders", "settings"];

type Item = { id: string; [k: string]: unknown };

async function load(name: string): Promise<Item[]> {
  assertRedis();
  return ((await redis.get<Item[]>(`col:${name}`)) ?? []) as Item[];
}

function check(name: string) {
  if (!ALLOWED.includes(name)) {
    return NextResponse.json({ error: "不明なコレクションです" }, { status: 404 });
  }
  return null;
}

function fail(e: unknown) {
  return NextResponse.json(
    { error: e instanceof Error ? e.message : "データベースに接続できませんでした" },
    { status: 500 }
  );
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  const bad = check(name);
  if (bad) return bad;
  try {
    const items = await load(name);
    const filters = Array.from(req.nextUrl.searchParams.entries());
    const result = items.filter((it) => filters.every(([k, v]) => String(it[k]) === v));
    return NextResponse.json({ items: result });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  const bad = check(name);
  if (bad) return bad;
  try {
    const body = await req.json();
    const items = await load(name);
    const item: Item = {
      ...body,
      id: body.id || `${name.slice(0, 2)}${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
      createdAt: body.createdAt || Date.now(),
    };
    items.push(item);
    // 肥大化防止(メッセージ・履歴は直近のみ保持)
    const capped = items.length > 3000 ? items.slice(items.length - 3000) : items;
    await redis.set(`col:${name}`, capped);
    return NextResponse.json({ item });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  const bad = check(name);
  if (bad) return bad;
  try {
    const { id, updates } = await req.json();
    const items = await load(name);
    let updated: Item | null = null;
    const next = items.map((it) => {
      if (it.id !== id) return it;
      updated = { ...it, ...updates };
      return updated;
    });
    if (!updated) {
      // settings など未作成の単一レコードは新規作成
      updated = { id, ...updates, createdAt: Date.now() };
      next.push(updated);
    }
    await redis.set(`col:${name}`, next);
    return NextResponse.json({ item: updated });
  } catch (e) {
    return fail(e);
  }
}

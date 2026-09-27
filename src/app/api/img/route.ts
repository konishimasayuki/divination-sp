import { NextRequest, NextResponse } from "next/server";
import { assertRedis, redis } from "@/lib/redis";

// 画像の保存(商品写真・プロフィール写真など)。一覧データとは別に1枚ずつ保存する
export async function POST(req: NextRequest) {
  try {
    assertRedis();
    const { data } = await req.json();
    if (typeof data !== "string" || !/^data:image\/(jpeg|png|webp);base64,/.test(data)) {
      return NextResponse.json({ error: "画像形式が正しくありません" }, { status: 400 });
    }
    if (data.length > 900_000) return NextResponse.json({ error: "画像が大きすぎます" }, { status: 413 });
    const id = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    await redis.set(`img:${id}`, data);
    return NextResponse.json({ url: `/api/img/${id}` });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "保存に失敗しました" }, { status: 503 });
  }
}

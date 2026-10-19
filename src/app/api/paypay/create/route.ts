import { NextRequest, NextResponse } from "next/server";
import { redisConfigured } from "@/lib/redis";
import { createCode, paypayConfigured } from "@/lib/paypay";
import { findUser, loadSettings, savePayment } from "@/lib/payments";

// ポイント購入のPayPay決済を作成し、支払いページのURLを返す
// body: { userId, pack }  ※金額はサーバー側の設定から決める
export async function POST(req: NextRequest) {
  if (!paypayConfigured || !redisConfigured) {
    return NextResponse.json({ error: "PayPay決済はまだ準備中です" }, { status: 503 });
  }
  try {
    const { userId, pack } = await req.json();
    const user = await findUser(String(userId ?? ""));
    if (!user) return NextResponse.json({ error: "会員情報が見つかりません" }, { status: 404 });
    const settings = await loadSettings();
    const p = settings.packs[Number(pack)];
    if (!p || p.price < 1) return NextResponse.json({ error: "ポイントパックが正しくありません" }, { status: 400 });

    const id = `sgi${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    const origin = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
    await savePayment({ id, userId: user.id, points: p.points, price: p.price, status: "CREATED", createdAt: Date.now() });
    const code = await createCode({
      merchantPaymentId: id,
      amount: p.price,
      description: `杉の泉 ポイント ${p.points.toLocaleString("ja-JP")}pt`,
      redirectUrl: `${origin}/points/complete?mp=${id}`,
    });
    return NextResponse.json({ id, url: code.url, deeplink: code.deeplink });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "PayPay決済を開始できませんでした" }, { status: 500 });
  }
}

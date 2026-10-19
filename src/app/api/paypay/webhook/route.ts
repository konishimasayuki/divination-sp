import { NextRequest, NextResponse } from "next/server";
import { syncPayment } from "@/lib/payments";

// PayPayからの決済通知(Webhook)
// 通知の中身は信用せず、PayPay APIに改めて問い合わせてから付与する
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = String(body.merchant_order_id ?? body.merchantPaymentId ?? "");
    if (id) await syncPayment(id);
  } catch {
    // 失敗してもPayPayへは200を返す(付与は完了画面の確認でも行われる)
  }
  return NextResponse.json({ ok: true });
}

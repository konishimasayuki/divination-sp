import { NextRequest, NextResponse } from "next/server";
import { syncPayment } from "@/lib/payments";

// 決済状況の確認(完了していればここでポイントを付与)
// GET /api/paypay/status?mp=<merchantPaymentId>
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("mp") ?? "";
  try {
    const p = await syncPayment(id);
    if (!p) return NextResponse.json({ error: "決済が見つかりません" }, { status: 404 });
    return NextResponse.json({ status: p.status, credited: !!p.credited, points: p.points, price: p.price });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "決済状況を確認できませんでした" }, { status: 500 });
  }
}
